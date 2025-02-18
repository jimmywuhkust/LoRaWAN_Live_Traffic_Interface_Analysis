// src/LineChart.jsx
import React, { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

const LineChart = ({ upinfo }) => {
  // Sort the upinfo array by SNR descending (highest to lowest)
  const sortedUpinfo = [...upinfo].sort((a, b) => b.snr - a.snr);

  // Log SNR, RSSI, and routerid for each entry
  useEffect(() => {
    sortedUpinfo.forEach(info => {
      console.log(`SNR: ${info.snr}, RSSI: ${info.rssi}, RouterID: ${info.routerid}`);
    });
  }, [sortedUpinfo]);

  // Create labels using routerid values and extract SNR for plotting
  const labels = sortedUpinfo.map(info => info.routerid);
  const snrValues = sortedUpinfo.map(info => info.snr);

  const data = {
    labels,
    datasets: [
      {
        label: 'SNR',
        data: snrValues,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: false,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default LineChart;