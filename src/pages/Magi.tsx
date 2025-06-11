import '../styles/magi.css'

function Magi() {
  return (
    <div id="app-container" className="container">
        <div id="magi-container" className="container">

        </div>
        <div id="input-container" className="container">
            <div id="input-title">QUESTION:</div>
            <input className="input-field" type="text" placeholder="여기에 질문을 입력" /> 
            <button className="input-button">確 認</button>
        </div>
    </div>
  );
}

export default Magi;