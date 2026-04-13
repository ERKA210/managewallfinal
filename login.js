(function () {
  const USERS = window.DEMO_USERS || {};
  const loginForm = document.getElementById('loginForm');
  const userIdInput = document.getElementById('userId');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const quickButtons = document.querySelectorAll('[data-user][data-pass]');

  if (!loginForm || !userIdInput || !passwordInput) return;

  function showError(message) {
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
    }
    if (successMsg) successMsg.style.display = 'none';
  }

  function showSuccess(message) {
    if (successMsg) {
      successMsg.textContent = message;
      successMsg.style.display = 'block';
    }
    if (errorMsg) errorMsg.style.display = 'none';
  }

  function fillCredentials(username, password) {
    userIdInput.value = username;
    passwordInput.value = password;
    showSuccess(`${username} эрхийн мэдээлэл бөглөгдлөө.`);
  }

  function saveSession(username, profile) {
    const session = {
      username,
      role: profile.role,
      fullName: profile.fullName,
      page: profile.page,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem('payroll_demo_session', JSON.stringify(session));
  }

  function login(username, password) {
    const profile = USERS[username];
    if (!profile || profile.password !== password) {
      showError('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна. Доорх demo эрхүүдээс сонгож болно.');
      return;
    }
    saveSession(username, profile);
    showSuccess(`${profile.role} эрхээр амжилттай нэвтэрлээ.`);
    setTimeout(() => { window.location.href = profile.page; }, 250);
  }

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const username = userIdInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      showError('Хэрэглэгчийн нэр болон нууц үгээ бүтэн оруулна уу.');
      return;
    }
    login(username, password);
  });

  quickButtons.forEach((button) => {
    button.addEventListener('click', () => fillCredentials(button.dataset.user, button.dataset.pass));
    button.addEventListener('dblclick', () => login(button.dataset.user, button.dataset.pass));
  });

  const existingSession = JSON.parse(localStorage.getItem('payroll_demo_session') || 'null');
  if (existingSession?.page) {
    showSuccess(`${existingSession.role} эрхийн өмнөх session илэрлээ. Шинээр нэвтрэх бол мэдээллээ оруулна уу.`);
  }
})();
