console.log("popup js запущен")
// Получаем ссылку на форму по её ID
const form = document.getElementById('form_red_button');


chrome.runtime.sendMessage(
  { message: "sendCheckStatusRedButton" },
  async (response) => {
    if (response.error) {
      console.error("popup js ошибка обработки сообщения:", response.error);
    } else {
      if (response.status === false) {
        // Добавляем обработчик события 'submit' к форме
        form.addEventListener("submit", function (event) {
          // Предотвращаем стандартное поведение отправки формы (перезагрузку страницы)
          event.preventDefault();

          // Получаем значения из текстовых полей по их ID
          const num_minut = document.getElementById("num_minut").value;
          console.log(num_minut);
          if (num_minut > 0) {
            this.reset();

            chrome.runtime.sendMessage(
              { message: "sendRedButton", num_minut: num_minut },
              async (response) => {
                if (response.error) {
                  console.error(
                    "popup js ошибка обработки сообщения:",
                    response.error
                  );
                } else {
                  console.log("popup js сообщение обработано");
                  console.log(response);
                  const targetElement = document.getElementById("status_red_buttom");
                  targetElement.textContent = `Красная кнопка уже использована. Осталось ${response.duration} минуты`;
                  targetElement.style.color = 'rgba(140, 7, 7, 0.8)';
                }
              }
            );
          }
        });
      } else {
        console.log(response);
        const targetElement = document.getElementById("status_red_buttom");
        targetElement.textContent = `Красная кнопка уже использована. Осталось ${response.duration} минуты`;
        targetElement.style.color ='rgba(140, 7, 7, 0.8)';
      }
    }
});