import '../styles/magi.css'
import Balthasar from '../assets/BALTHASAR.svg?react';
import Melchior from '../assets/MELCHIOR.svg?react';
import Casper from '../assets/CASPER.svg?react';
import Connect from '../components/Connect';

function Magi() {
  return (
    <div id="app-container" className="container">
        <div id="magi-container" className="container">
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                {/* Balthasar(중앙) -> Melchior(오른쪽) */}
                <Connect x1="50%" y1="30%" x2="80%" y2="85%" />
                
                {/* Melchior(오른쪽) -> Casper(왼쪽) */}
                <Connect x1="80%" y1="85%" x2="20%" y2="85%" />
                
                {/* Casper(왼쪽) -> Balthasar(중앙) */}
                <Connect x1="20%" y1="85%" x2="50%" y2="30%" />
            </svg>

            <Balthasar className="balthasar-svg" />
            <Melchior className="melchior-svg" />
            <Casper className="casper-svg" />
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