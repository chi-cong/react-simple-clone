import { RSC, createRoot } from "../packages/dom-client/index";

const container = document.getElementById("root");
const root = createRoot(container!);

const element = (
  <div className=''>
    <h1 style={{ color: "red" }}>Hello World 2</h1>
    <h1 style={{ color: "red" }}>Hello World 2</h1>
  </div>
);
root.render(element);

const App = () => {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
};

const multiChildElement = (
  <div className=''>
    <span>child 1</span>
    <span>child 2</span>
  </div>
);
console.log(<App />);
console.log(multiChildElement);
