# React Simple Clone

A simplified, educational implementation of React's core architecture, built from scratch to understand the fundamental principles of the Fiber reconciler, hooks system, and virtual DOM reconciliation.

## 🎯 Project Goal

This project is a learning-focused reimplementation of React's internal mechanisms. By building a subset of React's features from the ground up, it provides deep insights into how React works under the hood.

## ✨ Features

- **Fiber Architecture**: Work-in-progress tree structure for efficient updates
- **Reconciliation**: Diffing algorithm to minimize DOM operations
- **Hooks**: State management with `useState` (more hooks coming soon)
- **JSX Support**: Custom JSX runtime for component syntax
- **Event Handling**: Synthetic event system
- **DOM Integration**: Efficient rendering and updates

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (v10.14.0 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/chi-cong/react-simple-clone.git
cd react-simple-clone

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with watch mode
pnpm start
```

This will compile TypeScript files, watch for changes, and serve the application. Open your browser to `http://localhost:8080` to see the demo counter application. Manually refresh the browser to see your changes.

## 🎮 Example Usage

```tsx
import { RSC, createRoot, useState } from "./packages/dom-client/index";

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
```

## 🔍 Key Differences from React

This is a **simplified educational implementation** and differs from React in several ways:

- No concurrent mode or time-slicing
- Limited hook implementations (only `useState`)
- Simplified event system (no event pooling)
- No error boundaries or suspense
- No server-side rendering
- Synchronous rendering only

## Attribution

This project is a derivative work based on the [React](https://github.com/facebook/react) source code. Core concepts, architecture patterns, and algorithmic approaches are adapted from the original implementation by Meta Platforms, Inc. and affiliates.

This is an **educational project** created to learn and teach React's internal mechanisms. It is not intended for production use.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details, which includes acknowledgment of Meta Platforms, Inc.'s original copyright.

## 🤝 Contributing

This is a personal learning project, but if you're also learning React internals and have ideas or spot something interesting, feel free to reach out or share your thoughts!

## 📬 Contact

**Chi Cong Vu**

- GitHub: [@chi-cong](https://github.com/chi-cong)

---

_Built with ❤️ to understand React's magic_
