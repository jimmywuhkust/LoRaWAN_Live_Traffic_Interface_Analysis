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
  // State to hold the last Info WebSocket message for debugging
  const [UpInfoMessage, setUpInfoMessage] = useState('There are no UPLINK messages yet.');
  // Toggle to show/hide Info message
  const [showUpInfoMessage, setshowUpInfoMessage] = useState(false);
  // State to hold the Payload (table-updating) message
  const [PayloadMessage, setPayloadMessage] = useState('There are no UPLINK messages yet.');
  // Toggle to show/hide the Payload message
  const [showPayloadMessage, setShowPayloadMessage] = useState(false);
  // State to hold the PHYPayload message
  const [PHYPayloadMessage, setPHYPayloadMessage] = useState('There are no UPLINK messages yet.');
  // Toggle to show/hide the PHYPayload message
  const [showPHYPayloadMessage, setShowPHYPayloadMessage] = useState(false);

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

    ws.onmessage = async(event) => {
      try {
        let messageData = event.data;

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
              // updateDataWithDelta(parsed.upinfo);
              setUpInfoMessage(JSON.stringify(parsed.upinfo));  
              const response = await fetch('http://127.0.0.1:5400/process', { // 更新端口为 5400
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  frmpayload_hex:  parsed.FRMPayload,
                  dev_addr: JSON.stringify(parsed.DevAddr),
                  apps_key: '2B7E151628AED2A6ABF7158809CF4F3C',
                  nwks_key: '2B7E151628AED2A6ABF7158809CF4F3C',
                  fcnt_up:  parseInt(parsed.FCntUp, 10),
                  frame_type: JSON.stringify(parsed.confirm) === 'false' ? 2 : 4,
                  ack: 0,
                  class_b: JSON.stringify(parsed.dClass) === 'B' ? 1 : 0,
                })
              });
              // console.log('frmpayload_hex:', parseInt(parsed.FRMPayload, 16).toString(10));
              // console.log('fcnt_up:',  parseInt(parsed.FCntUp, 10)); 
              console.log('Fetch response status:', response.status); 
              const result = await response.json();
              // console.log('Fetch result:', result); 
              if (result.phy_payload) {
                setPHYPayloadMessage(result.phy_payload);
              } else {
                setPHYPayloadMessage(`Error: ${result.error}`);
              }

          }

            // Otherwise, do nothing so previous data persists.
          } else {
            // If no filter is provided, update with all data.
            // updateDataWithDelta(parsed.upinfo);
          }
        }
        else if (parsed.FRMPayload) { 
          if (formattedFilter) {
            if (parsed.DevEui && parsed.DevEui.toUpperCase() === formattedFilter.toUpperCase()) {
            setPayloadMessage(messageData);
            }
          }
          // setfrmpayload(parsed.FRMPayload);
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
        // console.log(`Router ${routerKey}: previous RSSI = ${prev[routerKey]}, current RSSI = ${currentRssi}, delta = ${delta}`);
  
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
      <h2>Observer of HKUST Campus LoRaWAN Network</h2>
      <input
        type="text"
        placeholder="Enter DevEui of Your End Device (e.g., EB9BD6AC12B61EED)"
        value={filterInput}
        onChange={handleFilterChange}
        style={{ padding: '8px', width: '500px', fontSize: '16px' }}
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
        <p>Here is the information about the uplink.</p>
      )}
      {/* Info Message Toggle */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setshowUpInfoMessage(!showUpInfoMessage)}
          style={{ fontSize: '10px', padding: '5px' }}
        >
          {showUpInfoMessage ? "Hide Uplink Gateway Information" : "Show Uplink Gateway Information"}
        </button>
        {showUpInfoMessage && (
          <div style={{
            fontSize: '10px',
            marginTop: '5px',
            backgroundColor: '#f9f9f9',
            padding: '5px',
            border: '1px solid #ccc',
            wordBreak: 'break-all',
            color: 'black'
          }}>
            {UpInfoMessage}
          </div>
        )}
      </div>
      {/* Payload Message Toggle */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowPayloadMessage(!showPayloadMessage)}
          style={{ fontSize: '10px', padding: '5px' }}
        >
          {showPayloadMessage ?  "Hide Uplink Packet Information" : "Show Uplink Packet Information"}
        </button>
        {showPayloadMessage && (
          <div style={{
            fontSize: '10px',
            marginTop: '5px',
            backgroundColor: '#f9f9f9',
            padding: '5px',
            border: '1px solid #ccc',
            wordBreak: 'break-all',
            color: 'black'
          }}>
            {PayloadMessage}
          </div>
        )}
      </div>
      {/* PHYPayload Message Toggle */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowPHYPayloadMessage(!showPHYPayloadMessage)}
          style={{ fontSize: '10px', padding: '5px' }}
        >
          {showPHYPayloadMessage ? "Hide PHYPayload" : "Show PHYPayload"}
        </button>
        {showPHYPayloadMessage && (
          <div style={{
            fontSize: '10px',
            marginTop: '5px',
            backgroundColor: '#f9f9f9',
            padding: '5px',
            border: '1px solid #ccc',
            wordBreak: 'break-all',
            color: 'black'
          }}>
            {PHYPayloadMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevEuiFilter;