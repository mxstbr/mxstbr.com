// Helpers for the GitHub API
import "isomorphic-unfetch";

export const getGitHubRepo = repo =>
  fetch(`https://api.github.com/repos/${repo}`).then(
    res => (res.status < 300 && res.status > 100 ? res.json() : null)
  );
