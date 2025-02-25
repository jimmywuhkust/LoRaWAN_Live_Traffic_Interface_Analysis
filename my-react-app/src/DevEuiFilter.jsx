import React, { useState, useEffect } from 'react';
import JSONbig from 'json-bigint'; // Import json-bigint
import LineChart from './LineChart';
import UpinfoTable from './UpinfoTable';

// Helper function to format DevEui input.
const formatDevEui = (input) => {
  const hexOnly = input.replace(/[^a-fA-F0-9]/g, '');
  return hexOnly.match(/.{1,2}/g)?.join('-') || '';
};

const DevEuiFilter = () => {
  const [upinfo, setUpinfo] = useState([]);
  const [filterInput, setFilterInput] = useState('');
  const [formattedFilter, setFormattedFilter] = useState('');
  const [prevUpinfoMap, setPrevUpinfoMap] = useState({});
  const [deltaMapping, setDeltaMapping] = useState({});
  const [rawMessage, setRawMessage] = useState('');
  const [showRawMessage, setShowRawMessage] = useState(false);
  const [relevantMessage, setRelevantMessage] = useState('');
  const [showRelevantMessage, setShowRelevantMessage] = useState(false);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterInput(value);
    const formatted = formatDevEui(value);
    setFormattedFilter(formatted);
  };

  useEffect(() => {
    const ws = new WebSocket('ws://loranet01.ust.hk:7002/owner-c::2');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      try {
        let messageData = event.data;
        setRawMessage(messageData);
        if (messageData.startsWith("Received:")) {
          messageData = messageData.replace("Received:", "").trim();
        }
        // Use json-bigint to parse the message
        const parsed = JSONbig.parse(messageData);
        if (parsed.upinfo && Array.isArray(parsed.upinfo)) {
          // Save the entire parsed message for debugging
          if (formattedFilter) {
            if (parsed.DevEui && parsed.DevEui.toUpperCase() === formattedFilter.toUpperCase()) {
              updateDataWithDelta(parsed.upinfo);
              setRelevantMessage(JSON.stringify(parsed, null, 2));
            }
          } else {
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

  const updateDataWithDelta = (newUpinfo) => {
    setPrevUpinfoMap((prev) => {
      const newDeltaMapping = {};
      const updatedPrev = { ...prev };

      newUpinfo.forEach((entry) => {
        const routerKey = String(entry.routerid);
        const currentRssi = Number(entry.rssi);
        const previousRssi = Number(updatedPrev[routerKey]);
        const delta = !isNaN(previousRssi) ? currentRssi - previousRssi : 0;
        newDeltaMapping[routerKey] = delta;
        console.log(`Router ${routerKey}: previous RSSI = ${prev[routerKey]}, current RSSI = ${currentRssi}, delta = ${delta}`);
        updatedPrev[routerKey] = currentRssi;
      });

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