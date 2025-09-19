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

    const result = await res.json();

    const counts = [];
    result.data.user.contributionsCollection.contributionCalendar.weeks.forEach(w =>
      w.contributionDays.forEach(d => counts.push(d.contributionCount))
    );

    // Dimensions
    const width = 1200;
    const height = 400;
    const margin = 50;
    const max = Math.max(...counts);

    const xScale = i => margin + (i / (counts.length - 1)) * (width - 2 * margin);
    const yScale = v => height - margin - (v / max) * (height - 2 * margin);

    // Background grid lines
    let grid = "";
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = margin + ((height - 2 * margin) * i) / ySteps;
      grid += `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="#1f6feb" stroke-opacity="0.3"/>`;
    }

    // Smooth curve path (more control points for smoother curve)
    const pathPoints = counts.map((v, i) => [xScale(i), yScale(v)]);
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

      <!-- Grid -->
      ${grid}

      <!-- Smooth Curve -->
      <path d="${path}" fill="none" stroke="url(#grad)" stroke-width="3" filter="url(#glow)" stroke-linecap="round"/>
    </svg>`;

    return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
