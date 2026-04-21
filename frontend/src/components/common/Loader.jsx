function Loader({ fullscreen = false, message = "Loading..." }) {
  return (
    <div className={fullscreen ? "loader-screen" : "loader-inline"}>
      <div className="pulse-orb" />
      <p>{message}</p>
    </div>
  );
}

export default Loader;
