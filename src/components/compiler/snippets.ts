// snippets.ts - Language snippets configuration

interface Snippet {
  label: string;
  kind: number;
  documentation: string;
  insertText: string;
  insertTextRules: number;
}

export const LANGUAGE_SNIPPETS: Record<string, Snippet[]> = {
  python: [
    // Print statements
    {
      label: "print",
      kind: 27,
      documentation: "Print statement",
      insertText: "print(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "printf",
      kind: 27,
      documentation: "Print with f-string",
      insertText: 'print(f"${1:text} {${2:variable}}")',
      insertTextRules: 4,
    },
    // Control flow
    {
      label: "for",
      kind: 27,
      documentation: "For loop",
      insertText: "for ${1:item} in ${2:iterable}:\n    ${3:pass}",
      insertTextRules: 4,
    },
    {
      label: "forrange",
      kind: 27,
      documentation: "For loop with range",
      insertText: "for ${1:i} in range(${2:n}):\n    ${3:pass}",
      insertTextRules: 4,
    },
    {
      label: "if",
      kind: 27,
      documentation: "If statement",
      insertText: "if ${1:condition}:\n    ${2:pass}",
      insertTextRules: 4,
    },
    {
      label: "elif",
      kind: 27,
      documentation: "Elif statement",
      insertText: "elif ${1:condition}:\n    ${2:pass}",
      insertTextRules: 4,
    },
    {
      label: "else",
      kind: 27,
      documentation: "Else statement",
      insertText: "else:\n    ${1:pass}",
      insertTextRules: 4,
    },
    {
      label: "while",
      kind: 27,
      documentation: "While loop",
      insertText: "while ${1:condition}:\n    ${2:pass}",
      insertTextRules: 4,
    },
    // Functions
    {
      label: "def",
      kind: 27,
      documentation: "Function definition",
      insertText:
        'def ${1:function_name}(${2:parameters}):\n    """${3:docstring}"""\n    ${4:pass}',
      insertTextRules: 4,
    },
    {
      label: "lambda",
      kind: 27,
      documentation: "Lambda function",
      insertText: "lambda ${1:args}: ${2:expression}",
      insertTextRules: 4,
    },
    // Classes
    {
      label: "class",
      kind: 27,
      documentation: "Class definition",
      insertText:
        'class ${1:ClassName}:\n    """${2:docstring}"""\n    \n    def __init__(self, ${3:parameters}):\n        ${4:pass}',
      insertTextRules: 4,
    },
    // List operations
    {
      label: "list",
      kind: 27,
      documentation: "Create list",
      insertText: "${1:list_name} = [${2:elements}]",
      insertTextRules: 4,
    },
    {
      label: "append",
      kind: 27,
      documentation: "List append",
      insertText: "${1:list}.append(${2:item})",
      insertTextRules: 4,
    },
    {
      label: "extend",
      kind: 27,
      documentation: "List extend",
      insertText: "${1:list}.extend(${2:iterable})",
      insertTextRules: 4,
    },
    {
      label: "pop",
      kind: 27,
      documentation: "List pop",
      insertText: "${1:list}.pop(${2:index})",
      insertTextRules: 4,
    },
    {
      label: "remove",
      kind: 27,
      documentation: "List remove",
      insertText: "${1:list}.remove(${2:value})",
      insertTextRules: 4,
    },
    {
      label: "insert",
      kind: 27,
      documentation: "List insert",
      insertText: "${1:list}.insert(${2:index}, ${3:value})",
      insertTextRules: 4,
    },
    // Dictionary
    {
      label: "dict",
      kind: 27,
      documentation: "Create dictionary",
      insertText: "${1:dict_name} = {${2:key}: ${3:value}}",
      insertTextRules: 4,
    },
    // Exception handling
    {
      label: "try",
      kind: 27,
      documentation: "Try-except block",
      insertText:
        "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}",
      insertTextRules: 4,
    },
    {
      label: "with",
      kind: 27,
      documentation: "With statement",
      insertText: "with ${1:expression} as ${2:variable}:\n    ${3:pass}",
      insertTextRules: 4,
    },
    {
      label: "__main__",
      kind: 27,
      documentation: "Main guard",
      insertText: 'if __name__ == "__main__":\n    ${1:pass}',
      insertTextRules: 4,
    },
    // Input/Output
    {
      label: "input",
      kind: 27,
      documentation: "Get user input",
      insertText: '${1:variable} = input("${2:prompt}")',
      insertTextRules: 4,
    },
    // Comprehensions
    {
      label: "listcomp",
      kind: 27,
      documentation: "List comprehension",
      insertText: "[${1:expression} for ${2:item} in ${3:iterable}]",
      insertTextRules: 4,
    },
    {
      label: "dictcomp",
      kind: 27,
      documentation: "Dictionary comprehension",
      insertText: "{${1:key}: ${2:value} for ${3:item} in ${4:iterable}}",
      insertTextRules: 4,
    },
    // String Operations
    {
      label: "split",
      kind: 27,
      documentation: "String split",
      insertText: '${1:string}.split("${2:delimiter}")',
      insertTextRules: 4,
    },
    {
      label: "join",
      kind: 27,
      documentation: "Join list to string",
      insertText: '"${1:separator}".join(${2:list})',
      insertTextRules: 4,
    },
    {
      label: "strip",
      kind: 27,
      documentation: "Strip whitespace",
      insertText: "${1:string}.strip()",
      insertTextRules: 4,
    },
    {
      label: "replace",
      kind: 27,
      documentation: "String replace",
      insertText: '${1:string}.replace("${2:old}", "${3:new}")',
      insertTextRules: 4,
    },
    {
      label: "upper",
      kind: 27,
      documentation: "Convert to uppercase",
      insertText: "${1:string}.upper()",
      insertTextRules: 4,
    },
    {
      label: "lower",
      kind: 27,
      documentation: "Convert to lowercase",
      insertText: "${1:string}.lower()",
      insertTextRules: 4,
    },
    {
      label: "find",
      kind: 27,
      documentation: "Find substring",
      insertText: '${1:string}.find("${2:substring}")',
      insertTextRules: 4,
    },
    {
      label: "format",
      kind: 27,
      documentation: "String format method",
      insertText: '"${1:text} {}".format(${2:value})',
      insertTextRules: 4,
    },

    // File Operations
    {
      label: "open",
      kind: 27,
      documentation: "Open file",
      insertText:
        'with open("${1:filename}", "${2:r}") as ${3:f}:\n    ${4:content = f.read()}',
      insertTextRules: 4,
    },
    {
      label: "readfile",
      kind: 27,
      documentation: "Read file",
      insertText:
        'with open("${1:filename}", "r") as f:\n    ${2:lines} = f.readlines()',
      insertTextRules: 4,
    },
    {
      label: "writefile",
      kind: 27,
      documentation: "Write to file",
      insertText:
        'with open("${1:filename}", "w") as f:\n    f.write(${2:content})',
      insertTextRules: 4,
    },

    // Math and Numbers
    {
      label: "range",
      kind: 27,
      documentation: "Range function",
      insertText: "range(${1:start}, ${2:stop}, ${3:step})",
      insertTextRules: 4,
    },
    {
      label: "len",
      kind: 27,
      documentation: "Length function",
      insertText: "len(${1:object})",
      insertTextRules: 4,
    },
    {
      label: "sum",
      kind: 27,
      documentation: "Sum function",
      insertText: "sum(${1:iterable})",
      insertTextRules: 4,
    },
    {
      label: "max",
      kind: 27,
      documentation: "Max function",
      insertText: "max(${1:iterable})",
      insertTextRules: 4,
    },
    {
      label: "min",
      kind: 27,
      documentation: "Min function",
      insertText: "min(${1:iterable})",
      insertTextRules: 4,
    },
    {
      label: "abs",
      kind: 27,
      documentation: "Absolute value",
      insertText: "abs(${1:number})",
      insertTextRules: 4,
    },
    {
      label: "round",
      kind: 27,
      documentation: "Round number",
      insertText: "round(${1:number}, ${2:decimals})",
      insertTextRules: 4,
    },

    // List/Set/Tuple Operations
    {
      label: "sort",
      kind: 27,
      documentation: "Sort list",
      insertText: "${1:list}.sort()",
      insertTextRules: 4,
    },
    {
      label: "sorted",
      kind: 27,
      documentation: "Sorted function",
      insertText: "sorted(${1:iterable}, reverse=${2:False})",
      insertTextRules: 4,
    },
    {
      label: "reverse",
      kind: 27,
      documentation: "Reverse list",
      insertText: "${1:list}.reverse()",
      insertTextRules: 4,
    },
    {
      label: "index",
      kind: 27,
      documentation: "Find index",
      insertText: "${1:list}.index(${2:value})",
      insertTextRules: 4,
    },
    {
      label: "count",
      kind: 27,
      documentation: "Count occurrences",
      insertText: "${1:list}.count(${2:value})",
      insertTextRules: 4,
    },
    {
      label: "set",
      kind: 27,
      documentation: "Create set",
      insertText: "${1:set_name} = {${2:elements}}",
      insertTextRules: 4,
    },
    {
      label: "tuple",
      kind: 27,
      documentation: "Create tuple",
      insertText: "${1:tuple_name} = (${2:elements})",
      insertTextRules: 4,
    },

    // Dictionary Operations
    {
      label: "keys",
      kind: 27,
      documentation: "Dictionary keys",
      insertText: "${1:dict}.keys()",
      insertTextRules: 4,
    },
    {
      label: "values",
      kind: 27,
      documentation: "Dictionary values",
      insertText: "${1:dict}.values()",
      insertTextRules: 4,
    },
    {
      label: "items",
      kind: 27,
      documentation: "Dictionary items",
      insertText: "${1:dict}.items()",
      insertTextRules: 4,
    },
    {
      label: "get",
      kind: 27,
      documentation: "Dictionary get",
      insertText: "${1:dict}.get(${2:key}, ${3:default})",
      insertTextRules: 4,
    },
    {
      label: "update",
      kind: 27,
      documentation: "Dictionary update",
      insertText: "${1:dict}.update(${2:other_dict})",
      insertTextRules: 4,
    },

    // Type Conversions
    {
      label: "int",
      kind: 27,
      documentation: "Convert to integer",
      insertText: "int(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "str",
      kind: 27,
      documentation: "Convert to string",
      insertText: "str(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "float",
      kind: 27,
      documentation: "Convert to float",
      insertText: "float(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "bool",
      kind: 27,
      documentation: "Convert to boolean",
      insertText: "bool(${1:value})",
      insertTextRules: 4,
    },

    // Common Patterns
    {
      label: "enumerate",
      kind: 27,
      documentation: "Enumerate iterable",
      insertText:
        "for ${1:index}, ${2:item} in enumerate(${3:iterable}):\n    ${4:pass}",
      insertTextRules: 4,
    },
    {
      label: "zip",
      kind: 27,
      documentation: "Zip iterables",
      insertText:
        "for ${1:item1}, ${2:item2} in zip(${3:list1}, ${4:list2}):\n    ${5:pass}",
      insertTextRules: 4,
    },
    {
      label: "map",
      kind: 27,
      documentation: "Map function",
      insertText: "map(${1:function}, ${2:iterable})",
      insertTextRules: 4,
    },
    {
      label: "filter",
      kind: 27,
      documentation: "Filter function",
      insertText: "filter(${1:function}, ${2:iterable})",
      insertTextRules: 4,
    },
    {
      label: "any",
      kind: 27,
      documentation: "Any function",
      insertText: "any(${1:iterable})",
      insertTextRules: 4,
    },
    {
      label: "all",
      kind: 27,
      documentation: "All function",
      insertText: "all(${1:iterable})",
      insertTextRules: 4,
    },

    // Import Statements
    {
      label: "import",
      kind: 27,
      documentation: "Import module",
      insertText: "import ${1:module}",
      insertTextRules: 4,
    },
    {
      label: "from",
      kind: 27,
      documentation: "From import",
      insertText: "from ${1:module} import ${2:name}",
      insertTextRules: 4,
    },
    {
      label: "importas",
      kind: 27,
      documentation: "Import as",
      insertText: "import ${1:module} as ${2:alias}",
      insertTextRules: 4,
    },

    // Assert and Return
    {
      label: "assert",
      kind: 27,
      documentation: "Assert statement",
      insertText: 'assert ${1:condition}, "${2:message}"',
      insertTextRules: 4,
    },
    {
      label: "return",
      kind: 27,
      documentation: "Return statement",
      insertText: "return ${1:value}",
      insertTextRules: 4,
    },
    {
      label: "yield",
      kind: 27,
      documentation: "Yield statement",
      insertText: "yield ${1:value}",
      insertTextRules: 4,
    },

    // Decorators
    {
      label: "property",
      kind: 27,
      documentation: "Property decorator",
      insertText: "@property\ndef ${1:name}(self):\n    return self._${1:name}",
      insertTextRules: 4,
    },
    {
      label: "staticmethod",
      kind: 27,
      documentation: "Static method decorator",
      insertText:
        "@staticmethod\ndef ${1:method_name}(${2:args}):\n    ${3:pass}",
      insertTextRules: 4,
    },
    {
      label: "classmethod",
      kind: 27,
      documentation: "Class method decorator",
      insertText:
        "@classmethod\ndef ${1:method_name}(cls, ${2:args}):\n    ${3:pass}",
      insertTextRules: 4,
    },
  ],
  javascript: [
    // Console methods
    {
      label: "log",
      kind: 27,
      documentation: "Console log",
      insertText: "console.log(${1:value});",
      insertTextRules: 4,
    },
    {
      label: "error",
      kind: 27,
      documentation: "Console error",
      insertText: "console.error(${1:error});",
      insertTextRules: 4,
    },
    {
      label: "warn",
      kind: 27,
      documentation: "Console warn",
      insertText: "console.warn(${1:warning});",
      insertTextRules: 4,
    },
    // Control flow
    {
      label: "for",
      kind: 27,
      documentation: "For loop",
      insertText:
        "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "foreach",
      kind: 27,
      documentation: "ForEach loop",
      insertText: "${1:array}.forEach(${2:item} => {\n    ${3:// code}\n});",
      insertTextRules: 4,
    },
    {
      label: "forin",
      kind: 27,
      documentation: "For...in loop",
      insertText: "for (const ${1:key} in ${2:object}) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "forof",
      kind: 27,
      documentation: "For...of loop",
      insertText:
        "for (const ${1:item} of ${2:iterable}) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "if",
      kind: 27,
      documentation: "If statement",
      insertText: "if (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "else",
      kind: 27,
      documentation: "Else statement",
      insertText: "else {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "elseif",
      kind: 27,
      documentation: "Else if statement",
      insertText: "else if (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "while",
      kind: 27,
      documentation: "While loop",
      insertText: "while (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "switch",
      kind: 27,
      documentation: "Switch statement",
      insertText:
        "switch (${1:expression}) {\n    case ${2:value}:\n        ${3:// code}\n        break;\n    default:\n        ${4:// code}\n}",
      insertTextRules: 4,
    },
    // Functions
    {
      label: "function",
      kind: 27,
      documentation: "Function declaration",
      insertText:
        "function ${1:functionName}(${2:parameters}) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "arrow",
      kind: 27,
      documentation: "Arrow function",
      insertText:
        "const ${1:functionName} = (${2:parameters}) => {\n    ${3:// code}\n};",
      insertTextRules: 4,
    },
    {
      label: "async",
      kind: 27,
      documentation: "Async function",
      insertText:
        "async function ${1:functionName}(${2:parameters}) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    // Array methods
    {
      label: "push",
      kind: 27,
      documentation: "Array push",
      insertText: "${1:array}.push(${2:item});",
      insertTextRules: 4,
    },
    {
      label: "pop",
      kind: 27,
      documentation: "Array pop",
      insertText: "${1:array}.pop();",
      insertTextRules: 4,
    },
    {
      label: "shift",
      kind: 27,
      documentation: "Array shift",
      insertText: "${1:array}.shift();",
      insertTextRules: 4,
    },
    {
      label: "unshift",
      kind: 27,
      documentation: "Array unshift",
      insertText: "${1:array}.unshift(${2:item});",
      insertTextRules: 4,
    },
    {
      label: "map",
      kind: 27,
      documentation: "Array map",
      insertText: "${1:array}.map(${2:item} => ${3:item})",
      insertTextRules: 4,
    },
    {
      label: "filter",
      kind: 27,
      documentation: "Array filter",
      insertText: "${1:array}.filter(${2:item} => ${3:condition})",
      insertTextRules: 4,
    },
    {
      label: "reduce",
      kind: 27,
      documentation: "Array reduce",
      insertText:
        "${1:array}.reduce((${2:acc}, ${3:item}) => ${4:acc + item}, ${5:0})",
      insertTextRules: 4,
    },
    // Classes
    {
      label: "class",
      kind: 27,
      documentation: "Class definition",
      insertText:
        "class ${1:ClassName} {\n    constructor(${2:parameters}) {\n        ${3:// code}\n    }\n}",
      insertTextRules: 4,
    },
    // Error handling
    {
      label: "try",
      kind: 27,
      documentation: "Try-catch block",
      insertText:
        "try {\n    ${1:// code}\n} catch (${2:error}) {\n    ${3:// handle error}\n}",
      insertTextRules: 4,
    },
    // Promises
    {
      label: "promise",
      kind: 27,
      documentation: "Promise",
      insertText: "new Promise((resolve, reject) => {\n    ${1:// code}\n});",
      insertTextRules: 4,
    },
  ],
  java: [
    // Output
    {
      label: "sout",
      kind: 27,
      documentation: "System.out.println",
      insertText: "System.out.println(${1:value});",
      insertTextRules: 4,
    },
    {
      label: "print",
      kind: 27,
      documentation: "System.out.print",
      insertText: "System.out.print(${1:value});",
      insertTextRules: 4,
    },
    {
      label: "printf",
      kind: 27,
      documentation: "System.out.printf",
      insertText: 'System.out.printf("${1:format}", ${2:args});',
      insertTextRules: 4,
    },
    // Control flow
    {
      label: "for",
      kind: 27,
      documentation: "For loop",
      insertText:
        "for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "foreach",
      kind: 27,
      documentation: "Enhanced for loop",
      insertText:
        "for (${1:Type} ${2:item} : ${3:collection}) {\n    ${4:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "if",
      kind: 27,
      documentation: "If statement",
      insertText: "if (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "else",
      kind: 27,
      documentation: "Else statement",
      insertText: "else {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "elseif",
      kind: 27,
      documentation: "Else if statement",
      insertText: "else if (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "while",
      kind: 27,
      documentation: "While loop",
      insertText: "while (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "switch",
      kind: 27,
      documentation: "Switch statement",
      insertText:
        "switch (${1:expression}) {\n    case ${2:value}:\n        ${3:// code}\n        break;\n    default:\n        ${4:// code}\n}",
      insertTextRules: 4,
    },
    // Methods
    {
      label: "method",
      kind: 27,
      documentation: "Method declaration",
      insertText:
        "public ${1:void} ${2:methodName}(${3:parameters}) {\n    ${4:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "main",
      kind: 27,
      documentation: "Main method",
      insertText:
        "public static void main(String[] args) {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    // Classes
    {
      label: "class",
      kind: 27,
      documentation: "Class definition",
      insertText: "public class ${1:ClassName} {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    // ArrayList operations
    {
      label: "arraylist",
      kind: 27,
      documentation: "ArrayList declaration",
      insertText: "ArrayList<${1:Type}> ${2:list} = new ArrayList<>();",
      insertTextRules: 4,
    },
    {
      label: "add",
      kind: 27,
      documentation: "ArrayList add",
      insertText: "${1:list}.add(${2:item});",
      insertTextRules: 4,
    },
    {
      label: "remove",
      kind: 27,
      documentation: "ArrayList remove",
      insertText: "${1:list}.remove(${2:index});",
      insertTextRules: 4,
    },
    {
      label: "get",
      kind: 27,
      documentation: "ArrayList get",
      insertText: "${1:list}.get(${2:index})",
      insertTextRules: 4,
    },
    // Error handling
    {
      label: "try",
      kind: 27,
      documentation: "Try-catch block",
      insertText:
        "try {\n    ${1:// code}\n} catch (${2:Exception} ${3:e}) {\n    ${4:// handle exception}\n}",
      insertTextRules: 4,
    },
    // Scanner Input
    {
      label: "scanner",
      kind: 27,
      documentation: "Create Scanner",
      insertText: "Scanner ${1:scanner} = new Scanner(System.in);",
      insertTextRules: 4,
    },
    {
      label: "nextInt",
      kind: 27,
      documentation: "Read integer",
      insertText: "int ${1:num} = ${2:scanner}.nextInt();",
      insertTextRules: 4,
    },
    {
      label: "nextLine",
      kind: 27,
      documentation: "Read line",
      insertText: "String ${1:line} = ${2:scanner}.nextLine();",
      insertTextRules: 4,
    },
    {
      label: "nextDouble",
      kind: 27,
      documentation: "Read double",
      insertText: "double ${1:num} = ${2:scanner}.nextDouble();",
      insertTextRules: 4,
    },

    // String Operations
    {
      label: "length",
      kind: 27,
      documentation: "String length",
      insertText: "${1:string}.length()",
      insertTextRules: 4,
    },
    {
      label: "substring",
      kind: 27,
      documentation: "Substring",
      insertText: "${1:string}.substring(${2:start}, ${3:end})",
      insertTextRules: 4,
    },
    {
      label: "charAt",
      kind: 27,
      documentation: "Character at index",
      insertText: "${1:string}.charAt(${2:index})",
      insertTextRules: 4,
    },
    {
      label: "indexOf",
      kind: 27,
      documentation: "Index of substring",
      insertText: '${1:string}.indexOf("${2:substring}")',
      insertTextRules: 4,
    },
    {
      label: "replace",
      kind: 27,
      documentation: "Replace in string",
      insertText: '${1:string}.replace("${2:old}", "${3:new}")',
      insertTextRules: 4,
    },
    {
      label: "split",
      kind: 27,
      documentation: "Split string",
      insertText: '${1:string}.split("${2:delimiter}")',
      insertTextRules: 4,
    },
    {
      label: "toLowerCase",
      kind: 27,
      documentation: "Convert to lowercase",
      insertText: "${1:string}.toLowerCase()",
      insertTextRules: 4,
    },
    {
      label: "toUpperCase",
      kind: 27,
      documentation: "Convert to uppercase",
      insertText: "${1:string}.toUpperCase()",
      insertTextRules: 4,
    },
    {
      label: "trim",
      kind: 27,
      documentation: "Trim whitespace",
      insertText: "${1:string}.trim()",
      insertTextRules: 4,
    },
    {
      label: "equals",
      kind: 27,
      documentation: "String equals",
      insertText: "${1:string}.equals(${2:other})",
      insertTextRules: 4,
    },

    // Array Operations
    {
      label: "array",
      kind: 27,
      documentation: "Array declaration",
      insertText: "${1:int}[] ${2:array} = new ${1:int}[${3:size}];",
      insertTextRules: 4,
    },
    {
      label: "arrayinit",
      kind: 27,
      documentation: "Array initialization",
      insertText: "${1:int}[] ${2:array} = {${3:elements}};",
      insertTextRules: 4,
    },
    {
      label: "arraylength",
      kind: 27,
      documentation: "Array length",
      insertText: "${1:array}.length",
      insertTextRules: 4,
    },

    // ArrayList Operations
    {
      label: "size",
      kind: 27,
      documentation: "ArrayList size",
      insertText: "${1:list}.size()",
      insertTextRules: 4,
    },
    {
      label: "contains",
      kind: 27,
      documentation: "ArrayList contains",
      insertText: "${1:list}.contains(${2:item})",
      insertTextRules: 4,
    },
    {
      label: "isEmpty",
      kind: 27,
      documentation: "Check if empty",
      insertText: "${1:list}.isEmpty()",
      insertTextRules: 4,
    },
    {
      label: "clear",
      kind: 27,
      documentation: "Clear ArrayList",
      insertText: "${1:list}.clear();",
      insertTextRules: 4,
    },
    {
      label: "set",
      kind: 27,
      documentation: "ArrayList set",
      insertText: "${1:list}.set(${2:index}, ${3:item});",
      insertTextRules: 4,
    },

    // HashMap Operations
    {
      label: "hashmap",
      kind: 27,
      documentation: "HashMap declaration",
      insertText:
        "HashMap<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();",
      insertTextRules: 4,
    },
    {
      label: "put",
      kind: 27,
      documentation: "HashMap put",
      insertText: "${1:map}.put(${2:key}, ${3:value});",
      insertTextRules: 4,
    },
    {
      label: "getKey",
      kind: 27,
      documentation: "HashMap get",
      insertText: "${1:map}.get(${2:key})",
      insertTextRules: 4,
    },
    {
      label: "containsKey",
      kind: 27,
      documentation: "HashMap contains key",
      insertText: "${1:map}.containsKey(${2:key})",
      insertTextRules: 4,
    },
    {
      label: "keySet",
      kind: 27,
      documentation: "HashMap keySet",
      insertText: "${1:map}.keySet()",
      insertTextRules: 4,
    },

    // Math Operations
    {
      label: "Math.max",
      kind: 27,
      documentation: "Math max",
      insertText: "Math.max(${1:a}, ${2:b})",
      insertTextRules: 4,
    },
    {
      label: "Math.min",
      kind: 27,
      documentation: "Math min",
      insertText: "Math.min(${1:a}, ${2:b})",
      insertTextRules: 4,
    },
    {
      label: "Math.abs",
      kind: 27,
      documentation: "Math absolute",
      insertText: "Math.abs(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "Math.pow",
      kind: 27,
      documentation: "Math power",
      insertText: "Math.pow(${1:base}, ${2:exponent})",
      insertTextRules: 4,
    },
    {
      label: "Math.sqrt",
      kind: 27,
      documentation: "Math square root",
      insertText: "Math.sqrt(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "Math.random",
      kind: 27,
      documentation: "Random number",
      insertText: "Math.random()",
      insertTextRules: 4,
    },

    // Type Conversions
    {
      label: "parseInt",
      kind: 27,
      documentation: "Parse integer",
      insertText: "Integer.parseInt(${1:string})",
      insertTextRules: 4,
    },
    {
      label: "parseDouble",
      kind: 27,
      documentation: "Parse double",
      insertText: "Double.parseDouble(${1:string})",
      insertTextRules: 4,
    },
    {
      label: "toString",
      kind: 27,
      documentation: "Convert to string",
      insertText: "String.valueOf(${1:value})",
      insertTextRules: 4,
    },

    // Common Patterns
    {
      label: "dowhile",
      kind: 27,
      documentation: "Do-while loop",
      insertText: "do {\n    ${1:// code}\n} while (${2:condition});",
      insertTextRules: 4,
    },
    {
      label: "ternary",
      kind: 27,
      documentation: "Ternary operator",
      insertText:
        "${1:variable} = ${2:condition} ? ${3:true_value} : ${4:false_value};",
      insertTextRules: 4,
    },
    {
      label: "instanceOf",
      kind: 27,
      documentation: "Instance of check",
      insertText: "${1:object} instanceof ${2:Class}",
      insertTextRules: 4,
    },
    {
      label: "throws",
      kind: 27,
      documentation: "Method throws",
      insertText:
        "public ${1:void} ${2:methodName}(${3:parameters}) throws ${4:Exception} {\n    ${5:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "finally",
      kind: 27,
      documentation: "Finally block",
      insertText: "finally {\n    ${1:// cleanup code}\n}",
      insertTextRules: 4,
    },
    {
      label: "interface",
      kind: 27,
      documentation: "Interface definition",
      insertText:
        "public interface ${1:InterfaceName} {\n    ${2:// method signatures}\n}",
      insertTextRules: 4,
    },
    {
      label: "extends",
      kind: 27,
      documentation: "Class extends",
      insertText:
        "public class ${1:ClassName} extends ${2:SuperClass} {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "implements",
      kind: 27,
      documentation: "Class implements",
      insertText:
        "public class ${1:ClassName} implements ${2:Interface} {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "constructor",
      kind: 27,
      documentation: "Constructor",
      insertText:
        "public ${1:ClassName}(${2:parameters}) {\n    ${3:// initialization}\n}",
      insertTextRules: 4,
    },
    {
      label: "getter",
      kind: 27,
      documentation: "Getter method",
      insertText:
        "public ${1:Type} get${2:Name}() {\n    return ${3:field};\n}",
      insertTextRules: 4,
    },
    {
      label: "setter",
      kind: 27,
      documentation: "Setter method",
      insertText:
        "public void set${1:Name}(${2:Type} ${3:param}) {\n    this.${3:param} = ${3:param};\n}",
      insertTextRules: 4,
    },
  ],
  cpp: [
    // Output
    {
      label: "cout",
      kind: 27,
      documentation: "Console output",
      insertText: "cout << ${1:value} << endl;",
      insertTextRules: 4,
    },
    {
      label: "cin",
      kind: 27,
      documentation: "Console input",
      insertText: "cin >> ${1:variable};",
      insertTextRules: 4,
    },
    // Control flow
    {
      label: "for",
      kind: 27,
      documentation: "For loop",
      insertText:
        "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "if",
      kind: 27,
      documentation: "If statement",
      insertText: "if (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "else",
      kind: 27,
      documentation: "Else statement",
      insertText: "else {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "while",
      kind: 27,
      documentation: "While loop",
      insertText: "while (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "switch",
      kind: 27,
      documentation: "Switch statement",
      insertText:
        "switch (${1:expression}) {\n    case ${2:value}:\n        ${3:// code}\n        break;\n    default:\n        ${4:// code}\n}",
      insertTextRules: 4,
    },
    // Functions
    {
      label: "function",
      kind: 27,
      documentation: "Function definition",
      insertText:
        "${1:void} ${2:functionName}(${3:parameters}) {\n    ${4:// code}\n}",
      insertTextRules: 4,
    },
    // Classes
    {
      label: "class",
      kind: 27,
      documentation: "Class definition",
      insertText:
        "class ${1:ClassName} {\nprivate:\n    ${2:// members}\npublic:\n    ${3:// methods}\n};",
      insertTextRules: 4,
    },
    // Vector operations
    {
      label: "vector",
      kind: 27,
      documentation: "Vector declaration",
      insertText: "vector<${1:int}> ${2:vectorName};",
      insertTextRules: 4,
    },
    {
      label: "push_back",
      kind: 27,
      documentation: "Vector push_back",
      insertText: "${1:vector}.push_back(${2:item});",
      insertTextRules: 4,
    },
    {
      label: "pop_back",
      kind: 27,
      documentation: "Vector pop_back",
      insertText: "${1:vector}.pop_back();",
      insertTextRules: 4,
    },
    // Error handling
    {
      label: "try",
      kind: 27,
      documentation: "Try-catch block",
      insertText:
        "try {\n    ${1:// code}\n} catch (${2:exception}& ${3:e}) {\n    ${4:// handle exception}\n}",
      insertTextRules: 4,
    },
  ],
  c: [
    // Output
    {
      label: "printf",
      kind: 27,
      documentation: "Printf statement",
      insertText: 'printf("${1:format}\\n", ${2:args});',
      insertTextRules: 4,
    },
    {
      label: "scanf",
      kind: 27,
      documentation: "Scanf statement",
      insertText: 'scanf("${1:format}", &${2:variable});',
      insertTextRules: 4,
    },
    // Control flow
    {
      label: "for",
      kind: 27,
      documentation: "For loop",
      insertText:
        "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "if",
      kind: 27,
      documentation: "If statement",
      insertText: "if (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "else",
      kind: 27,
      documentation: "Else statement",
      insertText: "else {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "while",
      kind: 27,
      documentation: "While loop",
      insertText: "while (${1:condition}) {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "switch",
      kind: 27,
      documentation: "Switch statement",
      insertText:
        "switch (${1:expression}) {\n    case ${2:value}:\n        ${3:// code}\n        break;\n    default:\n        ${4:// code}\n}",
      insertTextRules: 4,
    },
    // Functions
    {
      label: "function",
      kind: 27,
      documentation: "Function definition",
      insertText:
        "${1:void} ${2:functionName}(${3:parameters}) {\n    ${4:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "main",
      kind: 27,
      documentation: "Main function",
      insertText: "int main() {\n    ${1:// code}\n    return 0;\n}",
      insertTextRules: 4,
    },
    // Struct
    {
      label: "struct",
      kind: 27,
      documentation: "Struct definition",
      insertText: "struct ${1:StructName} {\n    ${2:// members}\n};",
      insertTextRules: 4,
    },
  ],
  go: [
    // Output
    {
      label: "print",
      kind: 27,
      documentation: "fmt.Print",
      insertText: "fmt.Print(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "println",
      kind: 27,
      documentation: "fmt.Println",
      insertText: "fmt.Println(${1:value})",
      insertTextRules: 4,
    },
    {
      label: "printf",
      kind: 27,
      documentation: "fmt.Printf",
      insertText: 'fmt.Printf("${1:format}\\n", ${2:args})',
      insertTextRules: 4,
    },
    // Control flow
    {
      label: "for",
      kind: 27,
      documentation: "For loop",
      insertText:
        "for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n    ${3:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "if",
      kind: 27,
      documentation: "If statement",
      insertText: "if ${1:condition} {\n    ${2:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "else",
      kind: 27,
      documentation: "Else statement",
      insertText: "else {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    // Functions
    {
      label: "func",
      kind: 27,
      documentation: "Function definition",
      insertText:
        "func ${1:functionName}(${2:parameters}) ${3:returnType} {\n    ${4:// code}\n}",
      insertTextRules: 4,
    },
    {
      label: "main",
      kind: 27,
      documentation: "Main function",
      insertText: "func main() {\n    ${1:// code}\n}",
      insertTextRules: 4,
    },
    // Struct
    {
      label: "struct",
      kind: 27,
      documentation: "Struct definition",
      insertText: "type ${1:StructName} struct {\n    ${2:// fields}\n}",
      insertTextRules: 4,
    },
    // Slice operations
    {
      label: "append",
      kind: 27,
      documentation: "Append to slice",
      insertText: "${1:slice} = append(${1:slice}, ${2:value})",
      insertTextRules: 4,
    },
  ],
};
