import m12Image from '../../../assets/mood/m12.png';

export default function GlitchWatermark() {
  return (
    <img
      src={m12Image}
      alt=""
      aria-hidden="true"
      className="glitch pointer-events-none absolute left-1/2 top-2/3 w-[clamp(260px,38vw,560px)] select-none [transform:translate(-50%,-50%)]"
    />
  );
}
