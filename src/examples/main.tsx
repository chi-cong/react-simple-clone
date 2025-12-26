import { RSC, createRoot, useState } from "../packages/dom-client/index";

const root = createRoot(document.getElementById("root")!);

const Button = (props: any) => {
  return (
    <button onClick={props.onClick} className={props.className || ""}>
      {props.children}
    </button>
  );
};

const App = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className='container'>
      <h1>Simple Clone Counter</h1>
      <div className='counter-value' style={{ opacity: count === 0 ? 0.2 : 1 }}>
        {count}
      </div>
      <div className='button-group'>
        <Button className='secondary' onClick={decrement}>
          -
        </Button>
        <Button onClick={increment}>+</Button>
        <Button className='danger' onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
};

root.render(<App />);
