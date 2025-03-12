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
  // State for DEV EUI filter and RID filter
  const [upinfo, setUpinfo] = useState([]);
  const [filterInput, setFilterInput] = useState('');
  const [formattedFilter, setFormattedFilter] = useState('');
  const [ridFilter, setRidFilter] = useState('');

  // State for previous RSSI to calculate delta
  const [prevUpinfoMap, setPrevUpinfoMap] = useState({});
  const [deltaMapping, setDeltaMapping] = useState({});

  // States for debugging messages
  const [rawMessage, setRawMessage] = useState('');
  const [showRawMessage, setShowRawMessage] = useState(false);
  const [relevantMessage, setRelevantMessage] = useState('');
  const [showRelevantMessage, setShowRelevantMessage] = useState(false);

  // States for recording functionality
  const [recording, setRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [customFileName, setCustomFileName] = useState('recorded_data.csv');

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterInput(value);
    const formatted = formatDevEui(value);
    setFormattedFilter(formatted);
  };

  const handleRidFilterChange = (e) => {
    setRidFilter(e.target.value);
  };

  // Generate CSV content from recorded data
  const generateCSV = () => {
    // CSV header
    const header = ['timestamp', 'routerid', 'rssi', 'snr'];
    const rows = recordedData.map(item => [
      item.timestamp,
      item.routerid,
      item.rssi,
      item.snr
    ]);
    // Join rows into CSV string
    return [header, ...rows].map(e => e.join(",")).join("\n");
  };

  // Download CSV file using a Blob
  const handleDownloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", customFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle recording state. When starting, reset any previous recorded data.
  const handleRecordingToggle = () => {
    if (recording) {
      // Stop recording – you might trigger additional actions here if needed.
      setRecording(false);
    } else {
      setRecordedData([]); // Reset history before recording
      setRecording(true);
    }
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
        // Parse message with json-bigint
        const parsed = JSONbig.parse(messageData);

        if (parsed.upinfo && Array.isArray(parsed.upinfo)) {
          // Check DEV EUI filter (if provided)
          const devEuiMatches = formattedFilter 
            ? parsed.DevEui && parsed.DevEui.toUpperCase() === formattedFilter.toUpperCase() 
            : true;
          // If RID filter is provided, filter the upinfo array by routerid
          const filteredUpinfo = ridFilter 
            ? parsed.upinfo.filter(entry => String(entry.routerid) === ridFilter)
            : parsed.upinfo;

          if (devEuiMatches && filteredUpinfo.length > 0) {
            updateDataWithDelta(filteredUpinfo);
            setRelevantMessage(JSON.stringify(parsed, null, 2));

            // If recording is enabled, append the SNR and RSSI values with a timestamp
            if (recording) {
              const timestamp = new Date().toISOString();
              const recordEntries = filteredUpinfo.map(entry => ({
                timestamp,
                routerid: entry.routerid,
                rssi: entry.rssi,
                snr: entry.snr // Assuming the field "snr" exists in the message
              }));
              setRecordedData(prev => [...prev, ...recordEntries]);
            }
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
  // Adding formattedFilter, ridFilter and recording to dependency array to refresh when needed.
  }, [formattedFilter, ridFilter, recording]);

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
      <h2>Real WebSocket Output with DevEui & RID Filter</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Enter DevEui filter (e.g., EB9BD6AC12B61EED)"
          value={filterInput}
          onChange={handleFilterChange}
          style={{ padding: '8px', width: '300px', fontSize: '16px', marginRight: '10px' }}
        />
        <input
          type="text"
          placeholder="Enter Router ID filter"
          value={ridFilter}
          onChange={handleRidFilterChange}
          style={{ padding: '8px', width: '150px', fontSize: '16px' }}
        />
      </div>
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
        <button onClick={handleRecordingToggle} style={{ fontSize: '10px', padding: '5px' }}>
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        {/* When recording has stopped and data is available, allow CSV download */}
        {!recording && recordedData.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="Enter custom file name"
              style={{ fontSize: '10px', padding: '5px', marginRight: '5px' }}
            />
            <button onClick={handleDownloadCSV} style={{ fontSize: '10px', padding: '5px' }}>
              Download CSV
            </button>
          </div>
        )}
      </div>
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