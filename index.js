const form = document.querySelector('#formSaude');
const msg = document.querySelector('#msg');

form.addEventListener('submit', async (e)=>{
  e.preventDefault();

  const formData = new FormData(form);

  try{
    const response = await fetch("https://api.sheetmonkey.io/form/txfGUUxBzxfnCNxUEumv2M",{
      method:"POST",
      body:formData
    });

    if(response.ok){
      msg.textContent = "Registro enviado com sucesso!";
      form.reset();
    }else{
      msg.textContent = "Erro ao enviar.";
    }

  }catch(err){
    msg.textContent = "Erro de conexão.";
  }

});


const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});