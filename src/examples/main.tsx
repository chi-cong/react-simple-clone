import { RSC, createRoot, useState } from "../packages/dom-client/index";

const root = createRoot(document.getElementById("root")!);

const Button = (props: any) => {
  return <button onClick={props.onClick}>{props.children}</button>;
};

const App = () => {
  const [count, setCount] = useState(() => 1 + 1);
  const handleClick = () => {
    setCount((count: number) => count + 1);
  };

  console.log(count);

  return (
    <div>
      <div className=''>Count: {count}</div>
      <Button onClick={handleClick}>Click Me!</Button>
    </div>
  );
};
root.render(<App />);
