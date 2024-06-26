import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as d3 from "d3";

const PieChart = () => {
  const [jsonData, setJsonData] = useState(null); // State to hold JSON data fetched from the API
  const [loading, setLoading] = useState(true); // State to handle loading status

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/fetchData');
        setJsonData(response.data); // Set the fetched data to state
      } catch (error) {
        console.error('Error fetching data:', error); // Log any errors
      } finally {
        setLoading(false); // Set loading to false after data fetch is complete
      }
    };

    fetchData();
  }, []);

  const svgRef = useRef(); // Reference to the SVG element

  // useEffect to render the pie chart whenever jsonData changes
  useEffect(() => {
    if (jsonData) {
      const width = 400; // Adjusted width
      const height = 400; // Adjusted height
      const margin = 40;

      const radius = Math.min(width, height) / 2 - margin; // Calculate radius
      const innerRadius = radius * 0.4; // Adjusted inner radius

      // Create SVG element and set its dimensions
      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      // Prepare data for the pie chart by summing ACV values for each customer type
      const acvData = d3.rollup(
        jsonData,
        (v) => d3.sum(v, (d) => d.acv),
        (d) => d.Cust_Type
      );
      const totalACV = Array.from(acvData.values()).reduce((a, b) => a + b, 0); // Calculate total ACV

      // Define color scale
      const color = d3
        .scaleOrdinal()
        .domain(acvData.keys())
        .range(["#1f77b4", "#ff7f0e"]);

      // Create pie layout
      const pie = d3.pie().value((d) => d[1]);

      // Prepare data for pie chart
      const data_ready = pie(Array.from(acvData.entries()));

      // Define arc for pie slices
      const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

      // Draw pie slices
      svg
        .selectAll("path")
        .data(data_ready)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => color(d.data[0]))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

      // Add total ACV text in the center of the pie chart
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-size", "24px")
        .text(`Total $${(totalACV / 1000).toFixed(0)}K`);

      // Define arc for labels
      const labelArc = d3
        .arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

      // Add labels to pie slices
      svg
        .selectAll("text.label")
        .data(data_ready)
        .join("text")
        .attr("class", "label")
        .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
        .attr("dy", "0.35em")
        .attr("dx", (d) =>
          (d.endAngle + d.startAngle) / 2 > Math.PI ? "-1.5em" : "1.5em"
        )
        .attr("text-anchor", (d) =>
          (d.endAngle + d.startAngle) / 2 > Math.PI ? "end" : "start"
        )
        .text(
          (d) =>
            `${d.data[0]} $${(d.data[1] / 1000).toFixed(0)}K (${(
              (d.data[1] / totalACV) *
              100
            ).toFixed(0)}%)`
        );

      // Add polylines connecting labels to pie slices
      svg
        .selectAll("polyline")
        .data(data_ready)
        .join("polyline")
        .attr("points", (d) => {
          const pos = labelArc.centroid(d);
          pos[0] =
            (radius * 0.95 * (d.endAngle + d.startAngle)) / 2 > Math.PI ? -1 : 1;
          return [arc.centroid(d), labelArc.centroid(d), pos];
        })
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "1px");
    }
  }, [jsonData]); // Dependency array to trigger the effect when jsonData changes

  // Render the SVG element
  return (
    <div className='max-w-full mx-auto text-center'>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <svg ref={svgRef}></svg>
      )}
    </div>
  );
};

export default PieChart;
