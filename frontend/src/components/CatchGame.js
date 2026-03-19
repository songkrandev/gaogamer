import React, { useState, useEffect, useCallback } from 'react';
import { gameAPI } from '../services/api';
import { useDialog } from './DialogProvider';
import '../styles/CatchGame.css';

const CatchGame = ({ onGameEnd, onBackToMenu }) => {
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const { alert } = useDialog();

  // การ์ดคำตอบ 5 ใบที่คงที่
  const answerCards = [
    'answer_card_1.png',
    'answer_card_2.png',
    'answer_card_3.png',
    'answer_card_4.png',
    'answer_card_5.png'
  ];

  const startGame = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gameAPI.startCatchSession();
      setSession(response.data.session_id);
      setCurrentQuestion(response.data.first_question);
      setScore(0);
      setRound(1);
      setIsFinished(false);
      setLoading(false);
    } catch (err) {
      console.error('Failed to start catch game:', err);
      await alert({ variant: 'error', title: 'ไม่สำเร็จ', message: 'ไม่สามารถเริ่มเกมส์ได้ กรุณาลองใหม่' });
    }
  }, [alert]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleAnswer = async (answerCard) => {
    if (isFinished || loading) return;

    try {
      const response = await gameAPI.playCatchRound(session, answerCard);
      setScore(response.data.score);
      
      if (response.data.is_finished) {
        setIsFinished(true);
        await alert({ variant: 'success', title: 'เกมส์จบแล้ว', message: `คะแนนของคุณคือ ${response.data.score}` });
      } else {
        setCurrentQuestion(response.data.next_question);
        setRound(round + 1);
      }
    } catch (err) {
      console.error('Failed to play round:', err);
    }
  };

  if (loading) return <div className="game-status">กำลังเตรียมเกม...</div>;

  if (isFinished) {
    return (
      <div className="game-result">
        <h2>จบเกมแล้ว!</h2>
        <div className="final-score">คะแนนของคุณคือ: {score}</div>
        <div className="button-group">
          <button onClick={startGame} className="play-again-btn">เล่นอีกครั้ง</button>
          <button onClick={onBackToMenu} className="menu-btn">กลับเมนูหลัก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="catch-game-container">
      <div className="game-header-info">
        <span className="round-info">รอบที่: {round} / 10</span>
        <span className="score-info">คะแนน: {score}</span>
      </div>

      <div className="question-section">
        <h3>การ์ดคำถาม</h3>
        <div className="card-display question-card">
          <img 
            src={`/card1/${currentQuestion}`} 
            alt="Question" 
          />
        </div>
        <p className="instruction-text">เลือกคำตอบที่ไม่ตรงกับรูปภาพด้านบน</p>
      </div>

      <div className="answer-section">
        <h3>เลือกคำตอบ (5 ใบ)</h3>
        <div className="answer-grid">
          {answerCards.map((card, index) => (
            <div 
              key={index} 
              className="card-display answer-card"
              onClick={() => handleAnswer(card)}
            >
              <img 
                src={`/card1/${card}`} 
                alt={`Answer ${index + 1}`} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatchGame;
