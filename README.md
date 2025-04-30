
---

# 🌐 Neon IPC Dashboard

> A modern, real-time **Inter-Process Communication (IPC) Monitoring and Management Dashboard** that elegantly integrates multiple IPC mechanisms with a sleek UI, powerful analytics, and secure communication.

![IPC Dashboard]
![Screenshot (1099)](https://github.com/user-attachments/assets/2daa0836-dedc-493b-bf8f-f6eca442d421)
![Screenshot (1100)](https://github.com/user-attachments/assets/fe41f2c3-c022-4fca-b096-4be9a0c6a451)
![Screenshot (1101)](https://github.com/user-attachments/assets/84630790-99fe-4888-a370-49696671600a)



---

## 🚀 Features

### 🔗 IPC Methods Implemented

- **Pipe (WebSocket)**
  - Real-time bidirectional communication
  - Full-duplex message passing
  - WebSocket-based implementation for simplicity and speed

- **Message Queue**
  - FIFO (First-In-First-Out) message handling
  - Asynchronous communication
  - Persistent message storage using queue buffers

- **Shared Memory (SHM)**
  - Direct memory access between processes
  - Highest-speed communication method
  - Shared state management with synchronization

---

### 🔐 Tiered Security Architecture

- **LOW** – Basic authentication and connection validation
- **MEDIUM** – Enhanced message integrity and channel validation
- **HIGH** – Enforced encryption, secure handshakes, and strict access control

---

### 📊 Monitoring & Real-Time Metrics

- Live performance visualization (powered by **Chart.js**)
- Data throughput tracking (in Bytes/KB)
- Latency and round-trip time measurement
- Historical vs. current metric comparison
- Individual channel and system-wide statistics

---

### 🔌 Multi-Channel Support

- Support for multiple concurrent IPC sessions
- Independent channel control & security policies
- Real-time connection health status
- Channel name isolation and message targeting

---

## ⚙️ OS Concepts Integrated

| Concept              | Implementation Highlights                                     |
|----------------------|---------------------------------------------------------------|
| **Inter-Process Communication** | Pipes, Message Queues, and Shared Memory                              |
| **Process Management**           | Multi-process tracking, connection management                        |
| **Synchronization**             | Queue handling, memory state coordination, message consistency       |
| **Resource Management**         | Memory and connection pooling, load balancing, throughput optimization |

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3
- TailwindCSS (for styling)
- JavaScript (ES6+)
- Chart.js (for real-time graphs)
- FontAwesome (for icons)

**Backend:**
- Node.js with Express (Web server & WebSocket)
- Native C (Low-level IPC implementations)

---

## 📁 Project Structure

```
neon-ipc-dashboard/
├── app.js              # Frontend interaction logic
├── server.js           # Node.js + WebSocket backend
├── index.html          # Main Dashboard UI
├── ipc_server.c        # C implementation of IPC methods
├── ipc_test.c          # Test tools for native IPC
├── Makefile            # Build system for C components
├── package.json        # Node.js project metadata
└── README.md           # This file
```

---

## 🔧 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/neon-ipc-dashboard.git
cd neon-ipc-dashboard
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Compile C IPC Components
```bash
make
```

### 4. Start the Server
```bash
npm start
```

### 5. Open the Dashboard
```
http://localhost:8080
```

---

## 🧪 How to Use

### ✅ Establish Connection
- Choose an **IPC Method** (Pipe / Queue / SHM)
- Select a **Security Level**
- Enter a **Channel Name**
- Click **"Establish Connection"**

### 📤 Send Messages
- Use the **Message Center** to compose
- Click **"Send Message"**
- Monitor live feedback and metrics

### 📈 Monitor Performance
- View active sessions and data throughput
- Monitor **latency**, **message size**, and **channel state**
- Compare performance trends over time

---

## ⚡ Performance Highlights

- Sub-millisecond latency support (via SHM)
- Real-time message throughput graphs
- Byte-level transmission accuracy
- System load awareness and efficiency scoring

---

## 🛡️ Security Architecture

- Secure WebSocket channels with token verification
- Channel-level isolation to prevent cross-talk
- Encrypted messages in HIGH security mode
- Intelligent input sanitation & validation

---

## 🤝 Contributing

We welcome contributions from developers passionate about system-level programming, IPC, and UI engineering.

1. Fork this repository  
2. Create a new branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "Add awesome feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/my-feature
   ```
5. Create a **Pull Request** and let us review it!


## 🙌 Acknowledgments

- [Chart.js](https://www.chartjs.org/) for performance graphs  
- [TailwindCSS](https://tailwindcss.com/) for UI design  
- [Node.js](https://nodejs.org/) & [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) for networking  
- Native **C IPC** for high-speed inter-process communication  

---
