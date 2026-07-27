const CJK_CHAR = "\\u4e00-\\u9fa5";
const CJK_PUNCT = "\\u3000-\\u303f\\uff00-\\uffef";

const COMPACT_RULES = [
  new RegExp(`([${CJK_CHAR}])[ \\t\\u3000]+([${CJK_CHAR}])`, "g"),
  new RegExp(`([${CJK_CHAR}])[ \\t\\u3000]+([${CJK_PUNCT}])`, "g"),
  new RegExp(`([${CJK_PUNCT}])[ \\t\\u3000]+([${CJK_CHAR}])`, "g"),
  new RegExp(`([${CJK_CHAR}])[ \\t\\u3000]+([A-Za-z0-9])`, "g"),
  new RegExp(`([A-Za-z0-9])[ \\t\\u3000]+([${CJK_CHAR}])`, "g"),
];

function compactOcrLine(line: string): string {
  if (!line.trim()) {
    return "";
  }

  let result = line.replace(/\u3000/g, " ");

  for (const rule of COMPACT_RULES) {
    let previous: string;

    do {
      previous = result;
      result = result.replace(rule, "$1$2");
    } while (previous !== result);
  }

  return result.replace(/[ \t]{2,}/g, " ").trimEnd();
}

/**
 * 紧凑 OCR 文本：删除汉字之间、汉字与标点/英文之间的碎空格，保留段落换行与英文词间距。
 */
export function compactOcrText(text: string): string {
  return text
    .split("\n")
    .map((line) => compactOcrLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
