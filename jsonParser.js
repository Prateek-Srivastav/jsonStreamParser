const readline = require("readline");

function completeJSON(incompleteJSON) {
  function isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  function completeValue(value) {
    value = value.trim();
    if (value === "{") return "{}";
    if (value === "[") return "[]";
    if (value.startsWith('"'))
      return value + (value.endsWith('"') && value.length > 1 ? "" : '"');
    if (isNumeric(value)) return value;
    if (value === "true" || value === "false" || value === "null") return value;
    if (value.endsWith(",")) return "";
    return '"' + value + '"';
  }

  let result = "";
  let inString = false;
  let escape = false;
  let depth = 0;
  let objectDepth = 0;
  let arrayDepth = 0;
  let expectingValue = false;
  let expectingKey = false;
  let currentValue = "";

  for (let i = 0; i < incompleteJSON.length; i++) {
    const char = incompleteJSON[i];
    if (escape) {
      currentValue += char;
      escape = false;
      continue;
    }

    if (char === "\\" && inString) {
      currentValue += char;
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      if (!expectingValue) expectingKey = !expectingKey;
      currentValue += char;
    } else if (inString) {
      currentValue += char;
    } else if (char === "{" || char === "[") {
      if (currentValue) {
        result += completeValue(currentValue);
        currentValue = "";
      }
      depth++;
      if (char === "{") objectDepth++;
      if (char === "[") arrayDepth++;
      result += char;
      expectingValue = char === "[";
    } else if (char === "}" || char === "]") {
      if (currentValue) {
        result += completeValue(currentValue);
        currentValue = "";
      } else if (expectingValue) {
        result += "null";
      }
      depth--;
      if (char === "}") objectDepth--;
      if (char === "]") arrayDepth--;
      result += char;
      expectingValue = false;
    } else if (char === ":") {
      if (currentValue) {
        result += completeValue(currentValue);
        currentValue = "";
      }
      result += char;
      expectingValue = true;
    } else if (char === "," && incompleteJSON.at(-1) !== char) {
      if (currentValue) {
        result += completeValue(currentValue);
        currentValue = "";
      } else if (expectingValue) {
        result += "null";
      }
      result += char;
      expectingValue = false;
    }
  }

  if (currentValue) {
    result += completeValue(currentValue);
  }
  if (
    expectingValue &&
    !currentValue.startsWith(`"`) &&
    !isNumeric(currentValue)
  ) {
    result += "null";
  } else if (expectingKey && arrayDepth === 0) {
    if (currentValue) {
      result += ": null";
    } else {
      result += '"": null';
    }
  } else if (expectingKey && inString) {
    result += '": null';
  } else if (expectingKey && result.endsWith(",")) result = result.slice(0, -1);
  else if (!expectingKey && !expectingValue && result.endsWith('"')) {
    result += ": null";
  }

  while (depth > 0) {
    if (arrayDepth > 0) {
      result += "]";
      arrayDepth--;
    } else {
      result += "}";
      objectDepth--;
    }
    depth--;
  }

  try {
    return JSON.parse(result);
  } catch (error) {
    return console.log(error);
  }
}

function processJSONStream(jsonString) {
  let buffer = "";

  for (let i = 0; i < jsonString.length; i += 2) {
    buffer += jsonString.slice(i, i + 2);
    const result = completeJSON(buffer);
    console.log(`Chunk: "${buffer}" \nOutput:`, result);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter your JSON string: ", (input) => {
  processJSONStream(input);
  rl.close();
});
