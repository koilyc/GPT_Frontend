import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import fs from "fs";

const githubEventPath = process.env.GITHUB_EVENT_PATH;
if (!githubEventPath) {
  console.error("GITHUB_EVENT_PATH not set");
  process.exit(1);
}
const event = JSON.parse(fs.readFileSync(githubEventPath, "utf8"));
const repo = process.env.GITHUB_REPOSITORY || "";
const [owner, repoName] = repo.split("/");
const token = process.env.GITHUB_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;

const octokit = new Octokit({ auth: token });

async function callOpenAI(prompt) {
  if (!openaiKey) {
    return `(no OPENAI_API_KEY) 收到你的留言：\n\n${prompt}`;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7, // 稍微提高隨機性，讓回答比較不一樣
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI API error:", data);
    return "(agent 錯誤：無法取得 LLM 回應)";
  }

  return data.choices?.[0]?.message?.content ?? "(no reply)";
}

// 簡單根據留言內容做分類，幫助 LLM 產生更精準的回答
function classifyComment(commentBody) {
  const text = (commentBody || "").toLowerCase();

  if (/(錯誤|error|exception|bug|failed|失敗|crash|500|404|stack trace)/i.test(text)) {
    return "bug_report";
  }
  if (/(設計|架構|architecture|refactor|重構|最佳化|optimize)/i.test(text)) {
    return "design_discussion";
  }
  if (/(怎麼用|如何使用|how to|用法|example|sample|示例|範例)/i.test(text)) {
    return "usage_question";
  }
  if (/(文件|docs|documentation|說明文件|README|API_REFERENCE)/i.test(text)) {
    return "docs_feedback";
  }
  return "general";
}

function buildPrompt(commentBody, context) {
  const { commentType, issueTitle, prTitle, repoName } = context;
  const category = classifyComment(commentBody);

  const categoryHintMap = {
    bug_report: `
- 專注在協助排查錯誤。
- 優先給出可以立即嘗試的 debug 步驟（2～4 點）。
- 如有需要，可以建議提供 log、錯誤訊息或請對方貼 stack trace。`,
    design_discussion: `
- 針對設計或架構提供具體建議。
- 可以用條列比較不同方案的優缺點（2～3 點）。`,
    usage_question: `
- 針對「如何使用」類問題，示範實際操作步驟或簡短 code 範例。
- 步驟要明確、可直接照著做。`,
    docs_feedback: `
- 針對文件（README、API_REFERENCE 等）相關的問題，說明目前文件可能的位置，或建議怎麼補強文件。`,
    general: `
- 針對一般討論或回饋，先簡短回應對方的重點，再補充 1～2 個具體建議或後續可以做的事。`,
  };

  const categoryHint = categoryHintMap[category] || categoryHintMap.general;

  const contextTextParts = [];
  if (commentType === "issue" && issueTitle) {
    contextTextParts.push(`- Issue 標題：${issueTitle}`);
  }
  if (commentType === "pull_request" && prTitle) {
    contextTextParts.push(`- PR 標題：${prTitle}`);
  }
  if (repoName) {
    contextTextParts.push(`- Repo 名稱：${repoName}`);
  }

  const contextText =
    contextTextParts.length > 0
      ? `目前情境資訊：
${contextTextParts.join("\n")}

`
      : "";

  const prompt = `
你是一個專門協助開發者的 GitHub repo 助手，正在回覆 Issue 或 Pull Request 底下的留言。

請嚴格遵守以下原則：
- 一律使用「繁體中文」回答。
- 先用 1～2 句話直接回應使用者留言的核心重點，不要只回客套話。
- 之後用條列清單列出 2～4 個具體建議、排查步驟或後續可以採取的行動。
- 如果留言是在回報錯誤或問題，優先提供「可以實際操作的檢查步驟」而不是泛泛而談。
- 盡量避免每次都用同樣的開頭或結尾句型，讓回覆看起來比較自然。
- 不要重複同一句建議超過一次。
- 如果資訊不足以做出精準判斷，可以說明你推測的幾種可能情況，並引導對方提供更多資訊。

針對這一則留言的類型，請特別注意：
${categoryHint}

${contextText}以下是使用者的留言內容（原文）：

"""${commentBody}"""

請根據上述原則生成一則回覆。回覆中不要包含「上述原則」、「這些規則」等 meta 訊息，只給出你對使用者的實際回覆內容。
`.trim();

  return prompt;
}

async function run() {
  try {
    let body = "";
    let commentTarget = null;
    let commentType = null;
    let issueTitle = "";
    let prTitle = "";

    if (event.comment && event.issue) {
      // issue_comment
      body = event.comment.body;
      commentTarget = { type: "issue", number: event.issue.number };
      commentType = "issue";
      issueTitle = event.issue.title || "";
    } else if (event.comment && event.pull_request) {
      // pull_request_review_comment
      body = event.comment.body;
      commentTarget = { type: "pull_request", number: event.pull_request.number };
      commentType = "pull_request";
      prTitle = event.pull_request.title || "";
    } else {
      console.log("Unrecognized event. Exiting.");
      return;
    }

    console.log("Received comment:", body);

    const prompt = buildPrompt(body, {
      commentType,
      issueTitle,
      prTitle,
      repoName,
    });

    const reply = await callOpenAI(prompt);
    console.log("LLM reply:", reply);

    if (!owner || !repoName) {
      console.error("Missing GITHUB_REPOSITORY info.");
      return;
    }

    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: commentTarget.number,
      body: reply,
    });

    console.log("Replied successfully.");
  } catch (err) {
    console.error("Agent run failed:", err);
    process.exit(1);
  }
}

run();
