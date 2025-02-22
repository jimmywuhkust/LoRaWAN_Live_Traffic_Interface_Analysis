// src/UpinfoTable.jsx
import React, { useState } from 'react';

const UpinfoTable = ({ upinfo }) => {
  // New state for gateway (router) filter input.
  const [gatewayFilter, setGatewayFilter] = useState("");

  // Filter upinfo based on the gatewayFilter input.
  const filteredUpinfo = upinfo.filter(entry => {
    if (!gatewayFilter.trim()) return true;
    // Convert routerid to string before applying toLowerCase.
    return String(entry.routerid).toLowerCase().includes(gatewayFilter.toLowerCase());
  });

  // Sort the filtered data by RSSI (descending – higher RSSI first).
  const sortedUpinfo = [...filteredUpinfo].sort((a, b) => b.rssi - a.rssi);

  // Helper function to compute "Router ID" from the routerid.
  // It converts the routerid to a hex string, pads it to at least 12 characters,
  // then takes the last 12 characters and formats them as XX:XX:XX:XX:XX:XX.
  const computeRouterId = (routerid) => {
    try {
      // Convert routerid to BigInt to support large numbers.
      const bigVal = BigInt(routerid);
      let hexStr = bigVal.toString(16).toUpperCase();
      // Pad to at least 12 characters with leading zeros.
      hexStr = hexStr.padStart(12, '0');
      // Take the last 12 characters.
      const last12 = hexStr.slice(-12);
      // Format as XX:XX:XX:XX:XX:XX.
      const pairs = last12.match(/.{1,2}/g);
      return pairs.join(':');
    } catch (error) {
      return "";
    }
  };

  return (
    <div>
      <h3>Upinfo Table</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>
          <strong>Filter by RID:</strong>
          <input 
            type="text" 
            placeholder="Enter RID" 
            value={gatewayFilter} 
            onChange={(e) => setGatewayFilter(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rank</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>RID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Router ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>SNR</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>RSSI</th>
          </tr>
        </thead>
        <tbody>
          {sortedUpinfo.map((entry, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{index + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.routerid}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{computeRouterId(entry.routerid)}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.snr}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.rssi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UpinfoTable;