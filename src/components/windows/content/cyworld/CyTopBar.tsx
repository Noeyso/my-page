export default function CyTopBar() {
  return (
    <div className="cy-top-bar">
      <div className="cy-today">
        <span className="cy-today-t">TODAY</span>
        <span className="cy-today-num">197</span>
        <span className="cy-today-sep">|</span>
        <span className="cy-total-t">TOTAL</span>
        <span className="cy-total-num">1,589,029</span>
      </div>
      <div className="cy-hompy-title">
        <strong>사이좋은 사람들, 싸이월드</strong>
      </div>
      <div className="cy-hompy-btns">
        <button type="button" className="cy-small-btn cy-btn-orange">
          일촌맺기
        </button>
        <button type="button" className="cy-small-btn">
          즐겨찾기
        </button>
        <button type="button" className="cy-small-btn">
          편집
        </button>
      </div>
    </div>
  );
}
