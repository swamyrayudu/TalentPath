import type * as Monaco from "monaco-editor";

/**
 * Registers custom completion providers for all supported languages
 * Provides IntelliSense for keywords and common functions/methods
 */
export const registerCompletionProviders = (monaco: typeof Monaco) => {
  // Python completion provider
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const pythonKeywords = [
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
        'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
        'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
        'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
      ];
      
      const pythonBuiltins = [
        'abs', 'all', 'any', 'append', 'bin', 'bool', 'chr', 'dict', 'dir', 'divmod',
        'enumerate', 'filter', 'float', 'format', 'help', 'hex', 'id', 'input', 'int',
        'isinstance', 'len', 'list', 'map', 'max', 'min', 'open', 'ord', 'pow', 'print',
        'range', 'reversed', 'round', 'set', 'sorted', 'str', 'sum', 'tuple', 'type', 'zip',
        'split', 'join', 'strip', 'replace', 'upper', 'lower', 'find', 'count', 'index',
        'pop', 'remove', 'insert', 'extend', 'sort', 'reverse', 'clear', 'copy', 'keys',
        'values', 'items', 'get', 'update', 'startswith', 'endswith', 'isdigit', 'isalpha'
      ];

      const suggestions = [
        ...pythonKeywords.map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: 'Python keyword',
          range: range,
        })),
        ...pythonBuiltins.map(builtin => ({
          label: builtin,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: builtin,
          detail: 'Python built-in',
          range: range,
        }))
      ];

      return { suggestions };
    }
  });

  // Java completion provider
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const javaKeywords = [
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
        'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
        'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
        'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package',
        'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
        'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
        'try', 'void', 'volatile', 'while'
      ];

      const javaCommon = [
        'System', 'String', 'Integer', 'Double', 'Boolean', 'ArrayList', 'HashMap',
        'Scanner', 'Math', 'Object', 'Exception', 'Thread', 'StringBuilder', 'Arrays',
        'Collections', 'List', 'Set', 'Map', 'Queue', 'Stack', 'LinkedList', 'HashSet',
        'TreeMap', 'TreeSet', 'Vector', 'Hashtable'
      ];

      const javaMethods = [
        'println', 'print', 'printf', 'nextInt', 'nextLine', 'nextDouble', 'next',
        'length', 'charAt', 'substring', 'indexOf', 'toLowerCase', 'toUpperCase',
        'trim', 'equals', 'split', 'replace', 'contains', 'startsWith', 'endsWith',
        'add', 'remove', 'get', 'set', 'size', 'isEmpty', 'clear', 'toString',
        'compareTo', 'append', 'insert', 'delete', 'reverse', 'sort', 'max', 'min',
        'abs', 'pow', 'sqrt', 'random', 'ceil', 'floor', 'round'
      ];

      const suggestions = [
        ...javaKeywords.map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: 'Java keyword',
          range: range,
        })),
        ...javaCommon.map(common => ({
          label: common,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: common,
          detail: 'Java class',
          range: range,
        })),
        ...javaMethods.map(method => ({
          label: method,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: method,
          detail: 'Java method',
          range: range,
        }))
      ];

      return { suggestions };
    }
  });

  // C completion provider
  monaco.languages.registerCompletionItemProvider('c', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const cKeywords = [
        'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
        'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int',
        'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
        'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
      ];

      const cFunctions = [
        'printf', 'scanf', 'malloc', 'calloc', 'realloc', 'free', 'sizeof', 'strlen', 
        'strcpy', 'strncpy', 'strcmp', 'strncmp', 'strcat', 'strncat', 'strchr', 'strstr',
        'memcpy', 'memmove', 'memset', 'memcmp', 'fopen', 'fclose', 'fread', 'fwrite',
        'fprintf', 'fscanf', 'fgets', 'fputs', 'fgetc', 'fputc', 'fseek', 'ftell',
        'rewind', 'getchar', 'putchar', 'gets', 'puts', 'atoi', 'atof', 'atol',
        'abs', 'labs', 'pow', 'sqrt', 'ceil', 'floor', 'sin', 'cos', 'tan', 'log'
      ];

      const cTypes = [
        'NULL', 'size_t', 'FILE', 'EOF', 'NULL', 'true', 'false'
      ];

      const suggestions = [
        ...cKeywords.map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: 'C keyword',
          range: range,
        })),
        ...cFunctions.map(func => ({
          label: func,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: func,
          detail: 'C standard library',
          range: range,
        })),
        ...cTypes.map(type => ({
          label: type,
          kind: monaco.languages.CompletionItemKind.Constant,
          insertText: type,
          detail: 'C constant',
          range: range,
        }))
      ];

      return { suggestions };
    }
  });

  // C++ completion provider
  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const cppKeywords = [
        'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor',
        'bool', 'break', 'case', 'catch', 'char', 'class', 'const', 'constexpr',
        'const_cast', 'continue', 'decltype', 'default', 'delete', 'do', 'double',
        'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false',
        'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable',
        'namespace', 'new', 'noexcept', 'not', 'nullptr', 'operator', 'or', 'private',
        'protected', 'public', 'return', 'short', 'signed', 'sizeof', 'static',
        'struct', 'switch', 'template', 'this', 'throw', 'true', 'try', 'typedef',
        'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void',
        'volatile', 'while'
      ];

      const cppStd = [
        'cout', 'cin', 'cerr', 'clog', 'endl', 'vector', 'string', 'map', 'set', 
        'queue', 'stack', 'deque', 'list', 'pair', 'tuple', 'array', 'unordered_map',
        'unordered_set', 'priority_queue', 'bitset', 'multiset', 'multimap'
      ];

      const cppMethods = [
        'push_back', 'pop_back', 'push_front', 'pop_front', 'size', 'empty', 'clear',
        'insert', 'erase', 'find', 'count', 'begin', 'end', 'front', 'back', 'top',
        'push', 'pop', 'sort', 'reverse', 'swap', 'resize', 'reserve', 'capacity',
        'at', 'substr', 'length', 'append', 'compare', 'c_str', 'data', 'replace',
        'find_first_of', 'find_last_of', 'toupper', 'tolower', 'getline'
      ];

      const suggestions = [
        ...cppKeywords.map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: 'C++ keyword',
          range: range,
        })),
        ...cppStd.map(std => ({
          label: std,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: std,
          detail: 'C++ STL',
          range: range,
        })),
        ...cppMethods.map(method => ({
          label: method,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: method,
          detail: 'C++ STL method',
          range: range,
        }))
      ];

      return { suggestions };
    }
  });

  // JavaScript completion provider
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const jsKeywords = [
        'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 
        'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
        'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
        'with', 'yield'
      ];

      const jsGlobals = [
        'console', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Math', 'Date',
        'JSON', 'Promise', 'Set', 'Map', 'WeakMap', 'WeakSet', 'Symbol', 'Error',
        'RegExp', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'undefined', 'null',
        'true', 'false', 'Infinity', 'NaN'
      ];

      const jsMethods = [
        'log', 'error', 'warn', 'info', 'dir', 'push', 'pop', 'shift', 'unshift', 
        'slice', 'splice', 'concat', 'join', 'reverse', 'sort', 'map', 'filter', 
        'reduce', 'forEach', 'find', 'findIndex', 'some', 'every', 'includes', 
        'indexOf', 'lastIndexOf', 'length', 'toString', 'valueOf', 'charAt', 
        'charCodeAt', 'substring', 'substr', 'split', 'trim', 'toLowerCase', 
        'toUpperCase', 'replace', 'match', 'search', 'test', 'exec', 'keys', 
        'values', 'entries', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
        'then', 'catch', 'finally', 'resolve', 'reject', 'all', 'race', 'allSettled'
      ];

      const suggestions = [
        ...jsKeywords.map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: 'JavaScript keyword',
          range: range,
        })),
        ...jsGlobals.map(global => ({
          label: global,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: global,
          detail: 'JavaScript built-in',
          range: range,
        })),
        ...jsMethods.map(method => ({
          label: method,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: method,
          detail: 'JavaScript method',
          range: range,
        }))
      ];

      return { suggestions };
    }
  });

  // Go completion provider
  monaco.languages.registerCompletionItemProvider('go', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const goKeywords = [
        'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
        'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
        'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
        'var'
      ];

      const goBuiltins = [
        'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len',
        'make', 'new', 'panic', 'print', 'println', 'real', 'recover'
      ];

      const goTypes = [
        'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
        'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string', 'uint',
        'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'true', 'false', 'nil'
      ];

      const goPackages = [
        'fmt', 'os', 'io', 'time', 'math', 'strings', 'strconv', 'errors', 'sort',
        'http', 'json', 'sync', 'context', 'net', 'bufio', 'bytes', 'regexp'
      ];

      const suggestions = [
        ...goKeywords.map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: 'Go keyword',
          range: range,
        })),
        ...goBuiltins.map(builtin => ({
          label: builtin,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: builtin,
          detail: 'Go built-in',
          range: range,
        })),
        ...goTypes.map(type => ({
          label: type,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: type,
          detail: 'Go type',
          range: range,
        })),
        ...goPackages.map(pkg => ({
          label: pkg,
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: pkg,
          detail: 'Go package',
          range: range,
        }))
      ];

      return { suggestions };
    }
  });
};

/**
 * Setup function called when Monaco Editor is mounted
 * Initializes the editor with custom configurations and completion providers
 */
export const setupEditor = (
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
) => {
  // Register all completion providers
  registerCompletionProviders(monaco);
  
  return editor;
};
