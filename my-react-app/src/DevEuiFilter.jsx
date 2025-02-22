// src/DevEuiFilter.jsx
import React, { useState, useEffect } from 'react';
import LineChart from './LineChart';
import UpinfoTable from './UpinfoTable';

// Helper function to format DevEui input: removes non-hex characters and inserts hyphens every two characters.
const formatDevEui = (input) => {
  const hexOnly = input.replace(/[^a-fA-F0-9]/g, '');
  return hexOnly.match(/.{1,2}/g)?.join('-') || '';
};

const DevEuiFilter = () => {
  const [upinfo, setUpinfo] = useState([]);
  const [filterInput, setFilterInput] = useState('');
  const [formattedFilter, setFormattedFilter] = useState('');
  // Map of routerid => previous RSSI value
  const [prevUpinfoMap, setPrevUpinfoMap] = useState({});
  // Mapping of routerid => delta (current RSSI - previous RSSI)
  const [deltaMapping, setDeltaMapping] = useState({});
  // State to hold the last raw WebSocket message for debugging
  const [rawMessage, setRawMessage] = useState('');
  // Toggle to show/hide raw message
  const [showRawMessage, setShowRawMessage] = useState(false);
  // State to hold the relevant (table-updating) message
  const [relevantMessage, setRelevantMessage] = useState('');
  // Toggle to show/hide the relevant message
  const [showRelevantMessage, setShowRelevantMessage] = useState(false);

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
        // Save the raw message for debugging
        setRawMessage(messageData);
        // Remove "Received:" prefix if present.
        if (messageData.startsWith("Received:")) {
          messageData = messageData.replace("Received:", "").trim();
        }
        const parsed = JSON.parse(messageData);
        // Only consider messages that contain "upinfo".
        if (parsed.upinfo && Array.isArray(parsed.upinfo)) {
          // Check filter: update data only if the DevEui matches (if a filter is provided)
          if (formattedFilter) {
            if (parsed.DevEui && parsed.DevEui.toUpperCase() === formattedFilter.toUpperCase()) {
              updateDataWithDelta(parsed.upinfo);
            }
            // Otherwise, do nothing so previous data persists.
          } else {
            // If no filter is provided, update with all data.
            updateDataWithDelta(parsed.upinfo);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedFilter]);

  // Update upinfo and compute delta mapping.
  const updateDataWithDelta = (newUpinfo) => {
    setPrevUpinfoMap((prev) => {
      const newDeltaMapping = {};
      const updatedPrev = { ...prev };
  
      newUpinfo.forEach((entry) => {
        // Ensure the routerid key is consistently a string.
        const routerKey = String(entry.routerid);
        // Explicitly convert RSSI to a number.
        const currentRssi = Number(entry.rssi);
        const previousRssi = Number(updatedPrev[routerKey]);
        const delta = !isNaN(previousRssi) ? currentRssi - previousRssi : 0;
        newDeltaMapping[routerKey] = delta;
  
        // Log for debugging
        console.log(`Router ${routerKey}: previous RSSI = ${prev[routerKey]}, current RSSI = ${currentRssi}, delta = ${delta}`);
  
        // Update the current value in our temporary copy.
        updatedPrev[routerKey] = currentRssi;
      });
  
      // Update deltaMapping and upinfo state based on the new snapshot.
      setDeltaMapping(newDeltaMapping);
      setUpinfo(newUpinfo);
  
      return updatedPrev;
    });
  };

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
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <LineChart upinfo={upinfo} />
          </div>
          <div style={{ flex: 1 }}>
            <UpinfoTable upinfo={upinfo} deltaMapping={deltaMapping} />
          </div>
        </div>
      ) : (
        <p>No matching upinfo data received yet...</p>
      )}
      {/* Raw Message Toggle */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowRawMessage(!showRawMessage)}
          style={{ fontSize: '10px', padding: '5px' }}
        >
          {showRawMessage ? "Hide Raw Message" : "Show Raw Message"}
        </button>
        {showRawMessage && (
          <div style={{
            fontSize: '10px',
            marginTop: '5px',
            backgroundColor: '#f9f9f9',
            padding: '5px',
            border: '1px solid #ccc',
            wordBreak: 'break-all',
            color: 'black'
          }}>
            {rawMessage}
          </div>
        )}
      </div>
      {/* Relevant Message Toggle */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowRelevantMessage(!showRelevantMessage)}
          style={{ fontSize: '10px', padding: '5px' }}
        >
          {showRelevantMessage ? "Hide Relevant Message" : "Show Relevant Message"}
        </button>
        {showRelevantMessage && (
          <div style={{
            fontSize: '10px',
            marginTop: '5px',
            backgroundColor: '#f9f9f9',
            padding: '5px',
            border: '1px solid #ccc',
            wordBreak: 'break-all',
            color: 'black'
          }}>
            {relevantMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevEuiFilter;