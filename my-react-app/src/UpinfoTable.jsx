// src/UpinfoTable.jsx
import React, { useState } from 'react';

const UpinfoTable = ({ upinfo }) => {
  const [gatewayFilter, setGatewayFilter] = useState("");

  const filteredUpinfo = upinfo.filter(entry => {
    if (!gatewayFilter.trim()) return true;
    return String(entry.routerid).toLowerCase().includes(gatewayFilter.toLowerCase());
  });

  const sortedUpinfo = [...filteredUpinfo].sort((a, b) => b.rssi - a.rssi);

  // This function treats the routerid as a string, pads it to at least 12 characters,
  // takes the last 12 characters, and formats them as XX:XX:XX:XX:XX:XX.
  const computeRouterId = (routerid) => {
    try {
      let hexStr;
      // If routerid is an object with a toString method that accepts a radix, use it.
      if (typeof routerid === 'object' && routerid.toString && routerid.toString(16)) {
        hexStr = routerid.toString(16).toUpperCase();
      } else {
        // Otherwise, assume it's already a string or a number.
        hexStr = String(routerid);
        // If it doesn't look like hex (e.g. only digits), you might try converting it using BigInt:
        if (/^\d+$/.test(hexStr)) {
          hexStr = BigInt(hexStr).toString(16).toUpperCase();
        }
      }
      // Ensure the hex string has at least 12 characters; if it's longer, take the last 12.
      if (hexStr.length > 12) {
        hexStr = hexStr.slice(-12);
      } else {
        hexStr = hexStr.padStart(12, '0');
      }
      // Insert a colon every two characters.
      return hexStr.replace(/(.{2})(?=.)/g, '$1:');
    } catch (error) {
      console.error("Error in computeRouterId:", error);
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
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.routerid.toString()}</td>
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