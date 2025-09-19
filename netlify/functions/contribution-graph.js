import { createCanvas } from "canvas";
import fetch from "node-fetch";
import Chart from "chart.js/auto";

export async function handler() {
  const USERNAME = "Karanraj-6";
  const TOKEN = process.env.GITHUB_TOKEN;

  // GitHub GraphQL API query
  const query = `
    query($username:String!) {
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
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { username: USERNAME } })
  });

  const data = await response.json();
  const days = [];
  const counts = [];

  data.data.user.contributionsCollection.contributionCalendar.weeks.forEach(
    (week) => {
      week.contributionDays.forEach((day) => {
        days.push(day.date);
        counts.push(day.contributionCount);
      });
    }
  );

  // Colors based on trend
  const colors = counts.map((c, i) => {
    if (i === 0) return "gray";
    if (c > counts[i - 1]) return "red";
    if (c < counts[i - 1]) return "green";
    return "gray";
  });

  // Create chart
  const width = 1200;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: days,
      datasets: [
        {
          label: "Contributions",
          data: counts,
          borderColor: "black",
          borderWidth: 1.5,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${USERNAME}'s Contribution Trend`
        }
      },
      scales: {
        x: {
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });

  // Return SVG
  return {
    statusCode: 200,
    headers: { "Content-Type": "image/svg+xml" },
    body: canvas.toBuffer("image/svg+xml").toString()
  };
}
