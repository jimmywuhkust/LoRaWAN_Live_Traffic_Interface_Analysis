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
      const idStr = routerid.toString();  // use toString() here
      const padded = idStr.padStart(12, '0');
      const last12 = padded.slice(-12);
      return last12.replace(/(.{2})(?=.)/g, '$1:');
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