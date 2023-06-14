import { useState } from 'react';
import './App.css';
import { useEffect } from 'react';

function App() {
  const nicePorts = [
    20, 21, 22, 139, 137, 445, 53, 443, 80, 8080, 8443, 23, 25, 69, 5173,
  ];
  const [ipValue, setIpValue] = useState('localhost');
  const [portValue, setPortValue] = useState('8888');
  const [openedPorts, setOpenedPorts] = useState([]);
  const [obtainedIp, setObtainedIp] = useState(false);
  const [ip, setIp] = useState('');

  const handleIpChange = (event) => {
    setIpValue(event.target.value);
  };

  const handlePortChange = (event) => {
    setPortValue(event.target.value);
  };

  const portIsOpen = async (hostToScan, portToScan, measurementsNo) => {
    const portClosed = 37857; // let's hope it's closed :D

    const timePortImage = (port) =>
      new Promise((resolve) => {
        const t0 = performance.now();
        const random = Math.random().toString().replace('0.', '').slice(0, 7);
        const img = new Image();

        img.onerror = () => {
          const elapsed = performance.now() - t0;
          resolve(parseFloat(elapsed.toFixed(3)));
        };

        img.src = `http://${hostToScan}:${port}/${random}.png`;
      });

    const timingsOpen = [];
    const timingsClosed = [];

    for (let i = 0; i < measurementsNo; i++) {
      timingsOpen.push(await timePortImage(portToScan));
      timingsClosed.push(await timePortImage(portClosed));
    }

    const sum = (arr) => arr.reduce((a, b) => a + b);
    const sumOpen = sum(timingsOpen);
    const sumClosed = sum(timingsClosed);
    const test1 = sumOpen >= sumClosed * 1.3;

    let m = 0;
    for (let i = 0; i < measurementsNo; i++) {
      if (timingsOpen[i] > timingsClosed[i]) {
        m++;
      }
    }

    const test2 = m >= Math.floor(0.8 * measurementsNo);
    const portIsOpen = test1 && test2;

    return [portIsOpen, m, sumOpen, sumClosed];
  };

  const getIPAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ipAddress = data.ip;
      return ipAddress;
    } catch (error) {
      console.log('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    nicePorts.forEach((port) =>
      portIsOpen('localhost', port, 30).then(([isOpen, ,]) => {
        console.log(`Is localhost:${port} open? ${isOpen}`);
        isOpen && setOpenedPorts([...openedPorts, port]);
      })
    );
  }, []);

  useEffect(() => {
    !obtainedIp &&
      getIPAddress()
        .then((ipAddress) => {
          console.log('IP Address:', ipAddress);
          setObtainedIp(true);
          setIp(ipAddress);
        })
        .catch((error) => {
          console.log('Error:', error);
        });
  }, [openedPorts]);

  return (
    <>
      <div className="card">
        <input type="text" value={ipValue} onChange={handleIpChange} />
        <input type="text" value={portValue} onChange={handlePortChange} />
        <button
          className="btnScan"
          onClick={() =>
            portIsOpen(ipValue, portValue, 30).then(([isOpen, ,]) => {
              alert(`Is ${ipValue}:${portValue} open? ${isOpen}`);
            })
          }
        >
          SCAN
        </button>
      </div>
    </>
  );
}

export default App;
