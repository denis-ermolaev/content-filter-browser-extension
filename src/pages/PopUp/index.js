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
              }
            }
          );
        });
      } else {
        // Выбираем элемент
        const targetElement = document.getElementById('status_red_buttom');

        // Добавляем текст
        targetElement.textContent = `Красная кнопка уже использована. Осталось ${response.duration} секунд`;
      }
    }
});