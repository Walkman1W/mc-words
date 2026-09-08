class LearningSupport extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) return;
    this.innerHTML = `
      <aside class="learning-support" aria-label="书籍与社群">
        <div class="support-books">
          <h2>从单词到故事</h2>
          <div class="support-book-list">
            <figure><img src="/assets/images/book-words.png" width="163" height="272" alt="我的世界单词卡书籍封面"><figcaption>单词卡</figcaption></figure>
            <figure><img src="/assets/images/book-sentences.png" width="161" height="272" alt="我的世界短句卡书籍封面"><figcaption>短句卡</figcaption></figure>
            <figure><img src="/assets/images/book-stories.png" width="164" height="272" alt="我的世界历险记书籍封面"><figcaption>历险记</figcaption></figure>
          </div>
        </div>
        <section class="support-connect" aria-label="社群服务与客服">
          <h3 class="support-connect-title">加入 MC 英语社群</h3>
          <p class="support-connect-intro">添加客服，咨询购书或申请入群</p>
            <div class="support-service-grid">
              <div class="support-service"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></svg></span><div><strong>外教带玩</strong><small>分享实用攻略</small></div></div>
              <div class="support-service"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg></span><div><strong>安装协助</strong><small>下载方法分享</small></div></div>
              <div class="support-service"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1v15"/></svg></span><div><strong>资料分享</strong><small>持续更新资源</small></div></div>
              <div class="support-service"><span class="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14a3 3 0 0 1-3 3H9l-5 4V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z"/><path d="M8 9h8M8 12h5"/></svg></span><div><strong>家长交流</strong><small>共同成长进步</small></div></div>

              <div class="support-contact">
                <button class="support-qr-button" type="button" aria-label="放大客服微信二维码"><img src="/assets/images/customer-wechat.png" width="160" height="160" alt="客服微信二维码"></button>
                <small>扫码添加 · 点击放大</small>
              </div>

            </div>
        </section>
        <div class="support-ai"><h3>MC 英语 AI 伴读</h3><span class="support-soon">即将上线</span></div>
      </aside>
      <dialog class="support-dialog" aria-label="客服微信二维码"><button class="support-close" type="button" aria-label="关闭二维码">✕</button><h2>添加客服微信</h2><img src="/assets/images/customer-wechat.png" width="330" height="330" alt="客服微信二维码，可使用微信扫一扫"><p>微信扫一扫 / 长按图片识别</p></dialog>`;
    const dialog = this.querySelector("dialog");
    this.querySelector(".support-qr-button").addEventListener("click", () =>
      dialog.showModal(),
    );
    this.querySelector(".support-close").addEventListener("click", () =>
      dialog.close(),
    );
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          dialog.close();
      }
    });
  }
}
customElements.define("learning-support", LearningSupport);
