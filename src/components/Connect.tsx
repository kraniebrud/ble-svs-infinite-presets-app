type Props = {
    handleConnect: () => void;
}

export default ({ handleConnect }: Props) => {
    return (
        <div>
            <h1>Connect</h1>
            <button onClick={handleConnect}>Connect</button>
        </div>
    );
}