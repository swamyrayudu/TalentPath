import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { language, code, stdin } = await request.json();

    // Validate inputs
    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: 'Code and language are required', output: '' },
        { status: 400 }
      );
    }

    // Format code safely
    const formattedCode = formatCode(code, language);
    const formattedStdin = stdin ? stdin.trim() : '';

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
        run_timeout: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const result = await response.json();

    // Safe access with fallbacks
    const stdout = result?.run?.stdout || '';
    const stderr = result?.run?.stderr || '';
    const output = result?.run?.output || stdout;
    const exitCode = result?.run?.code ?? -1;

    return NextResponse.json({
      success: !stderr && exitCode === 0,
      output: output || 'No output',
      stderr: stderr,
      exitCode: exitCode,
    });
  } catch (error: any) {
    console.error('Compile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error',
        output: `Compilation Error: ${error.message}`,
      },
      { status: 500 }
    );
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
    return code; // Return original if formatting fails
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
