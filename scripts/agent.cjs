const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch");
const fs = require("fs");

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

  try {
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
      }),
    });

    if (!res.ok) {
      console.error(`OpenAI API error: ${res.status} ${res.statusText}`);
      return "(OpenAI API error occurred)";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "(no reply)";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "(Failed to call OpenAI API)";
  }
}

async function run() {
  try {
    let body = "";
    let commentTarget = null;
    if (event.comment && event.issue) {
      body = event.comment.body;
      commentTarget = { type: "issue", number: event.issue.number };
    } else if (event.comment && event.pull_request) {
      body = event.comment.body;
      commentTarget = { type: "pull_request", number: event.pull_request.number };
    } else {
      console.log("Unrecognized event. Exiting.");
      return;
    }

    console.log("Received comment:", body);

    const prompt = `你是專門協助開發者的 repo 助手。使用下面的 comment 內容來給出簡短回覆或建議。\n\nComment:\n${body}\n\n請產生中文簡短回覆。`;

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
