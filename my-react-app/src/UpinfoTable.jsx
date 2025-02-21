// src/UpinfoTable.jsx
import React, { useState, useEffect } from 'react';

const UpinfoTable = ({ upinfo, deltaMapping }) => {
  // Get unique router IDs from the current upinfo data.
  const uniqueRouters = Array.from(new Set(upinfo.map(entry => entry.routerid)));

  // State for selected router IDs. Initially, all are selected.
  const [selectedRouters, setSelectedRouters] = useState(uniqueRouters);

  // When upinfo changes, update the unique routers and reset selected routers.
  useEffect(() => {
    const newUniqueRouters = Array.from(new Set(upinfo.map(entry => entry.routerid)));
    setSelectedRouters(newUniqueRouters);
  }, [upinfo]);

  // Handle checkbox toggling.
  const handleCheckboxChange = (routerid) => {
    if (selectedRouters.includes(routerid)) {
      setSelectedRouters(selectedRouters.filter(r => r !== routerid));
    } else {
      setSelectedRouters([...selectedRouters, routerid]);
    }
  };

  // Filter upinfo based on selected router IDs.
  const filteredUpinfo = upinfo.filter(entry => selectedRouters.includes(entry.routerid));

  // Sort the filtered data by RSSI (descending order – higher RSSI first).
  const sortedUpinfo = [...filteredUpinfo].sort((a, b) => b.rssi - a.rssi);

  return (
    <div>
      <h3>Upinfo Table</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Filter by Router ID:</strong>
        {Array.from(new Set(upinfo.map(entry => entry.routerid))).map(routerid => (
          <label key={routerid} style={{ marginLeft: '10px' }}>
            <input
              type="checkbox"
              checked={selectedRouters.includes(routerid)}
              onChange={() => handleCheckboxChange(routerid)}
            />
            {routerid}
          </label>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Rank</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Router ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>SNR</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>RSSI</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Delta (RSSI)</th>
          </tr>
        </thead>
        <tbody>
          {sortedUpinfo.map((entry, index) => {
            const delta = deltaMapping[entry.routerid] || 0;
            return (
              <tr key={index}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.routerid}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.snr}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{entry.rssi}</td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '8px',
                    color: delta > 0 ? 'green' : delta < 0 ? 'red' : 'black'
                  }}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UpinfoTable;