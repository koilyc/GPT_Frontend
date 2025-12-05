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

// Validate required environment variables
if (!token) {
  console.error("GITHUB_TOKEN not set");
  process.exit(1);
}

if (!owner || !repoName || !repo.includes("/")) {
  console.error("Invalid GITHUB_REPOSITORY format. Expected: owner/repo");
  process.exit(1);
}

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
      return "(OpenAI API 錯誤，無法產生回覆)";
    }
    
    const data = await res.json();
    
    if (data.error) {
      console.error(`OpenAI API error: ${data.error.message}`);
      return "(OpenAI API 錯誤，無法產生回覆)";
    }
    
    return data.choices?.[0]?.message?.content ?? "(no reply)";
  } catch (error) {
    console.error(`Network or fetch error: ${error.message}`);
    return "(網路連線錯誤，無法產生回覆)";
  }
}

async function run() {
  try {
    let body = "";
    let issueNumber = null;
    if (event.comment && event.issue) {
      body = event.comment.body;
      issueNumber = event.issue.number;
    } else if (event.comment && event.pull_request) {
      body = event.comment.body;
      issueNumber = event.pull_request.number;
    } else {
      console.log("Unrecognized event. Exiting.");
      return;
    }

    console.log("Received comment:", body);

    // Sanitize comment body to prevent prompt injection
    const sanitizedBody = body.substring(0, 2000).replace(/[\x00-\x1F\x7F]/g, "");
    
    const prompt = `你是專門協助開發者的 repo 助手。使用下面的 comment 內容來給出簡短回覆或建議。\n\nComment:\n${sanitizedBody}\n\n請產生中文簡短回覆。`;

    const reply = await callOpenAI(prompt);
    console.log("LLM reply:", reply);

    // GitHub API treats PR comments as issue comments, so we use issues.createComment for both
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: reply,
    });

    console.log("Replied successfully.");
  } catch (err) {
    console.error("Agent run failed:", err);
    process.exit(1);
  }
}

run();
