import fetch from "node-fetch";
import * as d3 from "d3";

export default async () => {
  try {
    const USERNAME = "Karanraj-6"; // your GitHub username
    const TOKEN = process.env.GITHUB_TOKEN; // your Netlify environment variable

    // GraphQL query to fetch last year contributions
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { username: USERNAME } }),
    });

    const result = await response.json();

    // Extract contributions
    const days = [];
    const counts = [];
    result.data.user.contributionsCollection.contributionCalendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        days.push(day.date);
        counts.push(day.contributionCount);
      });
    });

    // Create SVG using D3 scales
    const width = 1200;
    const height = 400;
    const margin = 40;

    const x = d3.scaleLinear().domain([0, counts.length - 1]).range([margin, width - margin]);
    const y = d3.scaleLinear().domain([0, Math.max(...counts)]).range([height - margin, margin]);

    let paths = "";
    for (let i = 1; i < counts.length; i++) {
      const x1 = x(i - 1);
      const y1 = y(counts[i - 1]);
      const x2 = x(i);
      const y2 = y(counts[i]);
      const color = counts[i] >= counts[i - 1] ? "red" : "green";
      paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2"/>`;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:#0d1117">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${paths}
        </g>
      </svg>
    `;

    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
