import { NextRequest, NextResponse } from 'next/server';

// Configuration constants
const MAX_OUTPUT_LINES = 50000;
const MAX_OUTPUT_SIZE = 50000000; // 50MB
const DISPLAY_LINES = 500;
const EXECUTION_TIMEOUT = 10000; // 10 seconds
const API_TIMEOUT = 12000; // 12 seconds (slightly higher than execution timeout)

// Supported languages - matching your frontend
const SUPPORTED_LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c', 'go'];

export async function POST(request: NextRequest) {
  try {
    const { language, code, stdin } = await request.json();

    // Validation
    if (!code || !language) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Code and language are required', 
          output: '',
          stderr: '❌ Error: Code and language are required'
        },
        { status: 400 }
      );
    }

    // Validate supported language
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported language: ${language}`, 
          output: '',
          stderr: `❌ Error: Language "${language}" is not supported.\n\nSupported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
        },
        { status: 400 }
      );
    }

    const formattedCode = formatCode(code, language);
    const formattedStdin = preprocessInput(stdin || '', language);

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
          compile_timeout: EXECUTION_TIMEOUT,
          run_timeout: EXECUTION_TIMEOUT,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Extract output information
      const stdout = result?.run?.stdout || '';
      const stderr = result?.run?.stderr || '';
      const output = result?.run?.output || stdout;
      const exitCode = result?.run?.code ?? -1;

      // Check for timeout errors
      if (stderr && (
        stderr.toLowerCase().includes('timeout') || 
        stderr.toLowerCase().includes('timed out') ||
        stderr.toLowerCase().includes('time limit exceeded')
      )) {
        return NextResponse.json({
          success: false,
          output: output.substring(0, 5000),
          stderr: `⏱️ Execution Timeout (${EXECUTION_TIMEOUT / 1000} seconds exceeded)\n\n` +
                  `Your code took too long to execute.\n\n` +
                  `💡 Tips:\n` +
                  `• Reduce loop iterations\n` +
                  `• Remove excessive print statements inside loops\n` +
                  `• Optimize your algorithm\n` +
                  `• Check for infinite loops\n\n` +
                  `Partial output shown above.`,
          exitCode: -1,
          timeout: true,
        });
      }

      // Check for memory/resource errors
      if (stderr && (
        stderr.toLowerCase().includes('memory') || 
        stderr.toLowerCase().includes('killed') ||
        stderr.toLowerCase().includes('segmentation fault') ||
        stderr.toLowerCase().includes('out of memory')
      )) {
        return NextResponse.json({
          success: false,
          output: output.substring(0, 10000),
          stderr: `💾 Resource Limit Exceeded\n\n` +
                  `Your code exceeded system limits.\n\n` +
                  `💡 Tips:\n` +
                  `• Reduce print statements inside loops\n` +
                  `• Use smaller data structures\n` +
                  `• Limit array/list sizes\n` +
                  `• Optimize memory usage\n\n` +
                  `Original error:\n${stderr.substring(0, 500)}`,
          exitCode: -1,
          limitExceeded: true,
        });
      }

      // Check for runtime errors
      if (stderr && exitCode !== 0) {
        return NextResponse.json({
          success: false,
          output: output || '',
          stderr: `❌ Runtime Error\n\n${stderr}\n\nExit code: ${exitCode}`,
          exitCode: exitCode,
        });
      }

      // Handle large output (by lines)
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

      // Handle large output (by size)
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

      // Success response
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
      
      // Handle AbortError (timeout)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          output: '',
          stderr: `⏱️ Execution Timeout (${EXECUTION_TIMEOUT / 1000} seconds)\n\n` +
                  `Your code took longer than ${EXECUTION_TIMEOUT / 1000} seconds.\n\n` +
                  `💡 Suggestions:\n` +
                  `• Reduce loop iterations\n` +
                  `• Remove print statements inside loops\n` +
                  `• Optimize your algorithm\n` +
                  `• Check for infinite loops`,
          exitCode: -1,
          timeout: true,
        });
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('Compile API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown server error',
        output: '',
        stderr: `❌ Server Error\n\n${error.message || 'An unexpected error occurred'}\n\nPlease try again.`,
      },
      { status: 500 }
    );
  }
}

/**
 * Preprocess stdin input - handles arrays, objects, and special formats
 */
function preprocessInput(input: string, language: string): string {
  if (!input) return '';
  
  try {
    // Convert escaped characters to actual characters
    let processed = input
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r');
    
    // Process each line
    const lines = processed.split('\n').map((line) => {
      line = line.trim();
      
      // Keep empty lines as-is (they're intentional)
      if (!line) return '';
      
      // Handle array format: [1,2,3] or [1, 2, 3] or []
      if (line.match(/^\[.*\]$/)) {
        try {
          const parsed = JSON.parse(line);
          if (Array.isArray(parsed)) {
            // For empty arrays, return empty string
            if (parsed.length === 0) return '';
            // Convert array to space-separated values
            return parsed.join(' ');
          }
          // Keep objects as JSON for manual parsing
          return line;
        } catch {
          // If JSON parse fails, try comma-separated extraction
          const content = line.slice(1, -1).trim(); // Remove [ and ]
          if (!content) return '';
          const values = content.split(',').map(v => v.trim()).filter(v => v);
          return values.length > 0 ? values.join(' ') : '';
        }
      }
      
      // Handle object format: {key: value} - keep as JSON string
      if (line.match(/^\{.*\}$/)) {
        return line;
      }
      
      // Handle tuple/parentheses format: (1,2,3) or ()
      if (line.match(/^\(.*\)$/)) {
        const content = line.slice(1, -1).trim();
        if (!content) return '';
        const values = content.split(',').map(v => v.trim()).filter(v => v);
        return values.length > 0 ? values.join(' ') : '';
      }
      
      // Handle comma-separated values without brackets
      if (line.includes(',') && !line.includes('"') && !line.includes("'")) {
        const values = line.split(',').map(v => v.trim()).filter(v => v);
        return values.join(' ');
      }
      
      return line;
    });
    
    // Join lines and remove excessive blank lines
    const result = lines.join('\n').replace(/\n{3,}/g, '\n\n');
    
    return result;
  } catch {
    // If preprocessing fails, return original input
    return input;
  }
}

/**
 * Format code based on language requirements
 */
function formatCode(code: string, language: string): string {
  try {
    let lines = code.split('\n');
    
    // Python: Convert tabs to spaces and trim trailing whitespace
    if (language === 'python') {
      lines = lines.map(line => line.replace(/\t/g, '    ').trimEnd());
    }
    
    // Java: Ensure class name is 'Main'
    if (language === 'java' && !code.includes('class Main')) {
      lines = lines.map(line => {
        if (line.includes('public class') && !line.includes('Main')) {
          return line.replace(/public class \w+/, 'public class Main');
        }
        return line;
      });
    }
    
    // C/C++: Trim trailing whitespace
    if (language === 'c' || language === 'cpp') {
      lines = lines.map(line => line.trimEnd());
    }
    
    return lines.join('\n');
  } catch (error) {
    return code;
  }
}

/**
 * Get file extension for the given language
 * Only includes supported languages
 */
function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
  };
  return extensions[language] || 'txt';
}
