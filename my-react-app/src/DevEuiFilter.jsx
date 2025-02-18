// src/DevEuiFilter.jsx
import React, { useState, useEffect } from 'react';
import LineChart from './LineChart';

// Helper function to format DevEui input: removes non-hex characters and inserts hyphens every two characters.
const formatDevEui = (input) => {
  const hexOnly = input.replace(/[^a-fA-F0-9]/g, '');
  return hexOnly.match(/.{1,2}/g)?.join('-') || '';
};

const DevEuiFilter = () => {
  const [upinfo, setUpinfo] = useState([]);
  const [filterInput, setFilterInput] = useState('');
  const [formattedFilter, setFormattedFilter] = useState('');

  // Update filter input and auto-format it.
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterInput(value);
    const formatted = formatDevEui(value);
    setFormattedFilter(formatted);
  };

  useEffect(() => {
    // Replace with your WebSocket URL as needed.
    const ws = new WebSocket('ws://loranet01.ust.hk:7002/owner-c::2');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      try {
        let messageData = event.data;
        // Remove "Received:" prefix if present.
        if (messageData.startsWith("Received:")) {
          messageData = messageData.replace("Received:", "").trim();
        }
        const parsed = JSON.parse(messageData);
        // Only consider messages that contain "upinfo".
        if (parsed.upinfo && Array.isArray(parsed.upinfo)) {
          // If a filter is set, update the data only if DevEui matches.
          if (formattedFilter) {
            if (parsed.DevEui && parsed.DevEui.toUpperCase() === formattedFilter.toUpperCase()) {
              setUpinfo(parsed.upinfo);
            }
            // If it doesn't match, do nothing and let the old data persist.
          } else {
            // If no filter is provided, you might choose to show all data.
            setUpinfo(parsed.upinfo);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [formattedFilter]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Real WebSocket Output with DevEui Filter</h2>
      <input
        type="text"
        placeholder="Enter DevEui filter (e.g., EB9BD6AC12B61EED)"
        value={filterInput}
        onChange={handleFilterChange}
        style={{ padding: '8px', width: '300px', fontSize: '16px' }}
      />
      <p>Formatted DevEui Filter: <strong>{formattedFilter}</strong></p>
      {formattedFilter && upinfo.length > 0 ? (
        <LineChart upinfo={upinfo} />
      ) : (
        <p>No matching upinfo data received yet...</p>
      )}
    </div>
  );
};

export default DevEuiFilter;