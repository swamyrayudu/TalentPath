import { NextRequest, NextResponse } from 'next/server';

// Judge0 CE API Configuration (Free & Reliable)
const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
const RAPID_API_KEY = process.env.RAPID_API_KEY || 'demo'; // Use 'demo' for testing
const MAX_OUTPUT_LINES = 2000;

// Language ID mapping for Judge0
const LANGUAGE_IDS: Record<string, number> = {
  python: 71,      // Python 3.8.1
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  java: 62,        // Java (OpenJDK 13.0.1)
  cpp: 54,         // C++ (GCC 9.2.0)
  c: 50,           // C (GCC 9.2.0)
  go: 60,          // Go (1.13.5)
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { language, code, stdin } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Code and language are required', 
          output: '',
          stderr: 'Code and language are required'
        },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported language: ${language}`, 
          output: '',
          stderr: `Language "${language}" not supported. Use: ${SUPPORTED_LANGUAGES.join(', ')}`
        },
        { status: 400 }
      );
    }

    const formattedCode = formatCode(code, language);
    const languageId = LANGUAGE_IDS[language];

    console.log('Using API Key:', RAPID_API_KEY === 'demo' ? 'DEMO MODE' : 'Custom Key');

    // Step 1: Submit code for execution
    const submitResponse = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: formattedCode,
        stdin: stdin || '',
        cpu_time_limit: 10,
        wall_time_limit: 15,
        memory_limit: 256000,
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text().catch(() => 'Unknown error');
      console.error('Judge0 submission error:', submitResponse.status, errorText);
      throw new Error(`Submission failed: ${submitResponse.status} - ${errorText}`);
    }

    const { token } = await submitResponse.json();

    // Step 2: Poll for results (max 30 attempts = 15 seconds)
    let attempts = 0;
    const maxAttempts = 30;
    let result: { status_id: number; stdout?: string; stderr?: string; compile_output?: string; status?: { description?: string } } | null = null;

    while (attempts < maxAttempts) {
      await sleep(500); // Wait 500ms between polls
      
      const resultResponse = await fetch(
        `${JUDGE0_API}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status_id,status,compile_output,time,memory`,
        {
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        }
      );

      if (!resultResponse.ok) {
        throw new Error(`Failed to get results: ${resultResponse.status}`);
      }

      result = await resultResponse.json();

      // Status ID: 1 = In Queue, 2 = Processing
      if (result && result.status_id > 2) {
        break;
      }

      attempts++;
    }

    if (!result) {
      throw new Error('No result received');
    }

    // Process results based on status
    const statusId = result.status_id;
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const compileOutput = result.compile_output || '';

    // Status 3 = Accepted (Success)
    if (statusId === 3) {
      let output = stdout;
      const lines = output.split('\n');
      
      if (lines.length > MAX_OUTPUT_LINES) {
        output = lines.slice(0, MAX_OUTPUT_LINES).join('\n');
        output += `\n\n⚠️ Output truncated: Showing first ${MAX_OUTPUT_LINES} of ${lines.length} lines`;
      }

      return NextResponse.json({
        success: true,
        output: output || '(No output)',
        stderr: '',
        exitCode: 0,
      });
    }

    // Status 6 = Compilation Error
    if (statusId === 6) {
      return NextResponse.json({
        success: false,
        output: '',
        stderr: `Compilation Error:\n\n${compileOutput || stderr}`,
        exitCode: 1,
      });
    }

    // Status 5 = Time Limit Exceeded
    if (statusId === 5) {
      return NextResponse.json({
        success: false,
        output: stdout,
        stderr: `Time Limit Exceeded\n\nYour code took too long to execute.\n\nTry:\n• Reduce loop iterations\n• Optimize your algorithm\n• Check for infinite loops`,
        exitCode: -1,
      });
    }

    // Status 11 = Runtime Error (SIGSEGV)
    // Status 12 = Runtime Error (SIGXFSZ)
    // Status 13 = Runtime Error (SIGFPE)
    // Status 14 = Runtime Error (SIGABRT)
    if ([11, 12, 13, 14].includes(statusId)) {
      return NextResponse.json({
        success: false,
        output: stdout,
        stderr: `Runtime Error (${result.status?.description || 'Unknown'})\n\n${stderr}`,
        exitCode: 1,
      });
    }

    // Any other error
    return NextResponse.json({
      success: false,
      output: stdout,
      stderr: `${result.status?.description || 'Execution Failed'}\n\n${stderr || compileOutput}`,
      exitCode: 1,
    });

  } catch (error) {
    console.error('Compiler error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Server error',
        output: '',
        stderr: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

function formatCode(code: string, language: string): string {
  let formatted = code;
  
  if (language === 'python') {
    // Replace tabs with spaces
    formatted = code.split('\n')
      .map(line => line.replace(/\t/g, '    '))
      .join('\n');
    
    // Remove prompt text from input() calls to prevent it from appearing in output
    // This converts input("enter: ") to input()
    formatted = formatted.replace(/input\s*\(\s*["'][^"']*["']\s*\)/g, 'input()');
  }
  
  if (language === 'javascript') {
    // Remove prompt text from readline or prompt calls
    // For Node.js readline: question("prompt", callback) -> question("", callback)
    formatted = formatted.replace(/question\s*\(\s*["'][^"']*["']\s*,/g, 'question("",');
  }
  
  if (language === 'java') {
    // Remove prompt text from System.out.print before scanner input
    // This removes lines like: System.out.print("Enter name: ");
    const lines = formatted.split('\n');
    const cleanedLines = lines.filter((line, index) => {
      // Check if this is a print statement followed by a scanner read
      if (line.includes('System.out.print') && !line.includes('println')) {
        const nextLine = lines[index + 1];
        if (nextLine && (nextLine.includes('sc.next') || nextLine.includes('scanner.next'))) {
          return false; // Remove the print statement
        }
      }
      return true;
    });
    formatted = cleanedLines.join('\n');
    
    if (!formatted.includes('class Main')) {
      formatted = formatted.replace(/public\s+class\s+\w+/g, 'public class Main');
    }
  }
  
  if (language === 'cpp' || language === 'c') {
    // Remove cout/printf prompt statements before cin/scanf
    const lines = formatted.split('\n');
    const cleanedLines = lines.filter((line, index) => {
      // Remove cout statements before cin
      if ((line.includes('cout') && line.includes('<<') && !line.includes('cin')) ||
          (line.includes('printf') && !line.includes('scanf'))) {
        const nextLine = lines[index + 1];
        if (nextLine && (nextLine.includes('cin') || nextLine.includes('scanf'))) {
          return false; // Remove the output statement
        }
      }
      return true;
    });
    formatted = cleanedLines.join('\n');
  }
  
  if (language === 'go') {
    // Remove fmt.Print statements before fmt.Scan
    const lines = formatted.split('\n');
    const cleanedLines = lines.filter((line, index) => {
      if (line.includes('fmt.Print') && !line.includes('fmt.Scan')) {
        const nextLine = lines[index + 1];
        if (nextLine && nextLine.includes('fmt.Scan')) {
          return false; // Remove the print statement
        }
      }
      return true;
    });
    formatted = cleanedLines.join('\n');
  }
  
  return formatted;
}
