import { NextRequest, NextResponse } from 'next/server';

const MAX_OUTPUT_LINES = 50000;
const MAX_OUTPUT_SIZE = 50000000; // 50MB
const DISPLAY_LINES = 500;
const EXECUTION_TIMEOUT = 10000; // 10 seconds

export async function POST(request: NextRequest) {
  try {
    const { language, code, stdin } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: 'Code and language are required', output: '' },
        { status: 400 }
      );
    }

    const formattedCode = formatCode(code, language);
    const formattedStdin = preprocessInput(stdin || '', language);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT);

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          language: language,
          version: '*',
          files: [
            {
              name: `main.${getFileExtension(language)}`,
              content: formattedCode,
            },
          ],
          stdin: formattedStdin,
          compile_timeout: 10000,
          run_timeout: 10000,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = await response.json();

      const stdout = result?.run?.stdout || '';
      const stderr = result?.run?.stderr || '';
      const output = result?.run?.output || stdout;
      const exitCode = result?.run?.code ?? -1;

      if (stderr && (
        stderr.toLowerCase().includes('timeout') || 
        stderr.toLowerCase().includes('timed out') ||
        stderr.toLowerCase().includes('time limit exceeded')
      )) {
        return NextResponse.json({
          success: false,
          output: output.substring(0, 5000),
          stderr: `⏱️ Execution Timeout (10 seconds exceeded)\n\n` +
                  `Your code took too long to execute.\n\n` +
                  `💡 Tips:\n` +
                  `- Reduce loop iterations\n` +
                  `- Remove excessive print statements inside loops\n` +
                  `- Optimize your algorithm\n\n` +
                  `Partial output shown above.`,
          exitCode: -1,
          timeout: true,
        });
      }

      if (stderr && (
        stderr.toLowerCase().includes('memory') || 
        stderr.toLowerCase().includes('killed') ||
        stderr.toLowerCase().includes('segmentation fault')
      )) {
        return NextResponse.json({
          success: false,
          output: output.substring(0, 10000),
          stderr: `💾 Resource Limit Exceeded\n\n` +
                  `Your code exceeded system limits.\n\n` +
                  `💡 Tips:\n` +
                  `- Reduce print statements\n` +
                  `- Use smaller data structures\n` +
                  `- Limit loop iterations\n\n` +
                  `Original error:\n${stderr.substring(0, 500)}`,
          exitCode: -1,
          limitExceeded: true,
        });
      }

      if (stderr && exitCode !== 0) {
        return NextResponse.json({
          success: false,
          output: output || '',
          stderr: `❌ Runtime Error\n\n${stderr}\n\nExit code: ${exitCode}`,
          exitCode: exitCode,
        });
      }

      const outputLines = output.split('\n');
      const totalLines = outputLines.length;

      if (totalLines > MAX_OUTPUT_LINES) {
        const firstLines = outputLines.slice(0, DISPLAY_LINES);
        const lastLines = outputLines.slice(-DISPLAY_LINES);
        const truncatedOutput = [
          ...firstLines,
          `\n... [${(totalLines - DISPLAY_LINES * 2).toLocaleString()} lines hidden] ...\n`,
          ...lastLines
        ].join('\n');

        return NextResponse.json({
          success: true,
          output: truncatedOutput,
          stderr: `📊 Large Output: ${totalLines.toLocaleString()} lines total\n\nShowing first and last ${DISPLAY_LINES.toLocaleString()} lines.`,
          exitCode: exitCode,
          limitExceeded: true,
          totalLines: totalLines,
        });
      }

      if (output.length > MAX_OUTPUT_SIZE) {
        const sizeMB = (output.length / (1024 * 1024)).toFixed(2);
        const limitMB = (MAX_OUTPUT_SIZE / (1024 * 1024)).toFixed(2);
        
        return NextResponse.json({
          success: true,
          output: output.substring(0, MAX_OUTPUT_SIZE),
          stderr: `📊 Large Output: ${sizeMB}MB total\n\nShowing first ${limitMB}MB.`,
          exitCode: exitCode,
          limitExceeded: true,
        });
      }

      return NextResponse.json({
        success: !stderr && exitCode === 0,
        output: output,
        stderr: stderr,
        exitCode: exitCode,
        outputLines: totalLines,
        outputSize: output.length,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          output: '',
          stderr: `⏱️ Execution Timeout (10 seconds)\n\n` +
                  `Your code took longer than 10 seconds.\n\n` +
                  `💡 Suggestions:\n` +
                  `- Reduce loop iterations\n` +
                  `- Remove print statements inside loops\n` +
                  `- Optimize your algorithm`,
          exitCode: -1,
          timeout: true,
        });
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('Compile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        output: '',
        stderr: `❌ Server Error\n\n${error.message}\n\nPlease try again.`,
      },
      { status: 500 }
    );
  }
}

function preprocessInput(input: string, language: string): string {
  if (!input) return '';
  
  try {
    // Convert escaped newlines to actual newlines
    let processed = input.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
    
    // Smart array/object format detection and conversion
    const lines = processed.split('\n').map((line, index, array) => {
      const originalLine = line;
      line = line.trim();
      
      // Keep empty lines as-is (they're intentional)
      if (!line) return '';
      
      // Detect array format: [1,2,3] or [1, 2, 3] or []
      if (line.match(/^\[.*\]$/)) {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(line);
          // Convert array to space-separated values for easier parsing
          if (Array.isArray(parsed)) {
            // For empty arrays, return a space (so split() returns [] but input() doesn't fail)
            if (parsed.length === 0) {
              return ' ';  // Single space - when split() is called, it returns [''] which can be filtered
            }
            return parsed.join(' ');
          }
          // Keep objects as JSON for manual parsing
          return line;
        } catch {
          // If JSON parse fails, try comma-separated extraction
          const content = line.slice(1, -1).trim(); // Remove [ and ]
          // Handle empty brackets
          if (!content) {
            return ' ';  // Single space for empty arrays
          }
          const values = content.split(',').map(v => v.trim()).filter(v => v);
          return values.length > 0 ? values.join(' ') : ' ';
        }
      }
      
      // Detect object format: {key: value}
      if (line.match(/^\{.*\}$/)) {
        // Keep as-is for manual JSON parsing
        return line;
      }
      
      // Detect tuple/parentheses format: (1,2,3) or ()
      if (line.match(/^\(.*\)$/)) {
        try {
          // Extract content and convert to space-separated
          const content = line.slice(1, -1).trim();
          if (!content) {
            return ' ';  // Single space for empty tuples
          }
          const values = content.split(',').map(v => v.trim()).filter(v => v);
          return values.length > 0 ? values.join(' ') : ' ';
        } catch {
          return line;
        }
      }
      
      return line;
    });
    
    // Join lines - preserve the structure
    const result = lines.join('\n');
    
    return result;
  } catch (error) {
    // If preprocessing fails, return original input
    return input;
  }
}

function formatCode(code: string, language: string): string {
  try {
    let lines = code.split('\n');
    
    if (language === 'python') {
      lines = lines.map(line => line.replace(/\t/g, '    ').trimEnd());
    }
    
    if (language === 'java' && !code.includes('class Main')) {
      lines = lines.map(line => {
        if (line.includes('public class') && !line.includes('Main')) {
          return line.replace(/public class \w+/, 'public class Main');
        }
        return line;
      });
    }
    
    return lines.join('\n');
  } catch (error) {
    return code;
  }
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
  };
  return extensions[language] || 'txt';
}
