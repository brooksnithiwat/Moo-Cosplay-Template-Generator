import { useState } from 'react';
import { FileButton } from './ui/Controls.jsx';

const ACCEPT = 'image/png,image/jpeg,image/webp';

/** First screen: nothing works until a template is uploaded, so this is the only thing offered. */
export default function LandingScreen({ onFile, busy, stage }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="landing"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && !busy) onFile(file);
      }}
    >
      <div className="landing-inner">
        
        <img className="landing-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="Moo Cosplay Template Generator" />
        <h1>
          Moo Cosplay <span>Template Generator</span>
        </h1>
        <p className="landing-lead">
          อัปโหลดรูป template แล้วเพิ่มข้อความ อีโมจิ และสติกเกอร์ลงบนรูปได้อย่างอิสระ!
        </p>
        <figure className="sample">
          <div className="sample-pair">
            <div>
              <img src={`${import.meta.env.BASE_URL}sample-before.jpg`} alt="ตัวอย่าง template ก่อนแก้ไข" loading="lazy" />
              <figcaption>Template ต้นแบบ</figcaption>
            </div>
            <span className="sample-arrow" aria-hidden="true">➜</span>
            <div>
              <img src={`${import.meta.env.BASE_URL}sample-after.jpg`} alt="ตัวอย่างโปสเตอร์หลังแก้ไข มีข้อความ สติกเกอร์ และเครื่องหมายถูก" loading="lazy" />
              <figcaption>ใส่ข้อความ สติกเกอร์ อีโมจิได้!</figcaption>
            </div>
          </div>
        </figure>

        <div className={`dropzone ${dragging ? 'dragging' : ''}`}>
          {busy ? (
            <div className="analyzing" role="status">
              <div className="spinner" />
              <strong>{stage || 'กำลังประมวลผล…'}</strong>
              <small>ทุกอย่างทำงานในเบราว์เซอร์ของคุณ ไม่มีการอัปโหลดไฟล์ไปที่ไหน</small>
            </div>
          ) : (
            <>
              <div className="dropzone-icon" aria-hidden="true">⬆</div>
              <strong>ลากรูป template มาวางที่นี่</strong>
              <small>รองรับไฟล์ PNG · JPG · WebP (แนะนำเป็นไฟล์ PNG นะ)</small>
              <FileButton accept={ACCEPT} onFile={onFile} className="btn primary large">
                เลือกไฟล์ template
              </FileButton>
            </>
          )}
        </div>

        

        <ol className="landing-steps">
          <li>
            <b>STEP 1</b>
            <strong>อัปโหลด template</strong>
            <span>รูปโปสเตอร์หรือพื้นหลังที่ต้องการใช้เป็นต้นแบบ ถ้าเป็น PNG ที่เจาะช่องโปร่งใสไว้ จะใส่ Main image ลงช่องนั้นได้</span>
          </li>
          <li>
            <b>STEP 2</b>
            <strong>เพิ่มองค์ประกอบ</strong>
            <span>เลือกเมนู Text, Shape หรือ Sticker แล้ววางตรงไหนก็ได้</span>
          </li>
          <li>
            <b>STEP 3</b>
            <strong>ดาวน์โหลด</strong>
            <span>ได้รูป PNG ขนาดเท่ารูป template ต้นฉบับ</span>
          </li>
        </ol>

        <footer className="credit">
          <div>จัดทำโดย Sinbad Thethird</div>
          <small>© {new Date().getFullYear()} Sinbad Thethird. All rights reserved.</small>
        </footer>
      </div>
    </div>
  );
}
