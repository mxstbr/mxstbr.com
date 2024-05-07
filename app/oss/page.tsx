import { getRepos } from "../github";
import ossProjects from "../oss-projects";

export default async function OSS() {
  const repos = await getRepos(ossProjects.map((project) => project.repo));

  return (
    <div className="prose">
      <h2>Open Source Projects</h2>
      <p>
        Open source projects I have (co-)created or maintained are used on more
        than 1% of all public, crawlable websites and have a total of{" "}
        {repos
          .reduce((total, repo) => total + repo.stargazerCount, 0)
          .toLocaleString()}{" "}
        stars on GitHub.
      </p>
      <ul>
        {repos
          .sort((a, b) => b.stargazerCount - a.stargazerCount)
          .map((repo) => (
            <li key={repo.nameWithOwner}>
              <a href={`https://github.com${repo.nameWithOwner}`}>
                {repo.nameWithOwner}
              </a>
              : {repo.stargazerCount.toLocaleString()} stars
            </li>
          ))}
      </ul>
    </div>
  );
}
