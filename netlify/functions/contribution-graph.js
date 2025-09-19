import fetch from "node-fetch";

export default async () => {
  const USERNAME = "Karanraj-6";
  const TOKEN = process.env.GITHUB_TOKEN;

  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = 2016; // replace with your GitHub join year

  const allCounts = [];

  for (let year = startYear; year <= currentYear; year++) {
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
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

    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query, variables: { username: USERNAME, from, to } }),
    });

    const result = await res.json();
    result.data.user.contributionsCollection.contributionCalendar.weeks.forEach(w =>
      w.contributionDays.forEach(d => allCounts.push(d.contributionCount))
    );
  }

  // Now `allCounts` has all contributions from start → current year
  const width = 1200;
  const height = 400;
  const margin = 50;
  const max = Math.max(...allCounts);

  const xScale = i => margin + (i / (allCounts.length - 1)) * (width - 2 * margin);
  const yScale = v => height - margin - (v / max) * (height - 2 * margin);

  // Background grid
  let grid = "";
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = margin + ((height - 2 * margin) * i) / ySteps;
    grid += `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="#1f6feb" stroke-opacity="0.3"/>`;
  }

  // Smooth curve
  const pathPoints = allCounts.map((v, i) => [xScale(i), yScale(v)]);
  let path = `M ${pathPoints[0][0]} ${pathPoints[0][1]}`;
  for (let i = 1; i < pathPoints.length; i++) {
    const [x0, y0] = pathPoints[i - 1];
    const [x1, y1] = pathPoints[i];
    const cx = (x0 + x1) / 2;
    path += ` Q ${x0} ${y0} ${cx} ${(y0 + y1) / 2} T ${x1} ${y1}`;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:#0d1117">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="red"/>
          <stop offset="50%" stop-color="orange"/>
          <stop offset="100%" stop-color="green"/>
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      ${grid}
      <path d="${path}" fill="none" stroke="url(#grad)" stroke-width="3" filter="url(#glow)" stroke-linecap="round"/>
    </svg>
  `;

  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
};
