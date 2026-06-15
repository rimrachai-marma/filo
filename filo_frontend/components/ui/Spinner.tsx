export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin border-accent border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}
