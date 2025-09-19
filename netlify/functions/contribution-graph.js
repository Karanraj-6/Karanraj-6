import fetch from "node-fetch";

export default async () => {
  try {
    const USERNAME = "Karanraj-6";
    const TOKEN = process.env.GITHUB_TOKEN;

    // GitHub GraphQL query
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query, variables: { username: USERNAME } }),
    });

    const data = await res.json();

    const counts = [];
    data.data.user.contributionsCollection.contributionCalendar.weeks.forEach(w =>
      w.contributionDays.forEach(d => counts.push(d.contributionCount))
    );

    // Dimensions
    const width = 1200;
    const height = 400;
    const margin = 40;

    const max = Math.max(...counts);

    const xScale = i => margin + (i / (counts.length - 1)) * (width - 2 * margin);
    const yScale = v => height - margin - (v / max) * (height - 2 * margin);

    let lines = "";
    for (let i = 1; i < counts.length; i++) {
      const color = counts[i] >= counts[i - 1] ? "red" : "green";
      lines += `<line x1="${xScale(i - 1)}" y1="${yScale(counts[i - 1])}" x2="${xScale(i)}" y2="${yScale(counts[i])}" stroke="${color}" stroke-width="2"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:#0d1117">${lines}</svg>`;

    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
