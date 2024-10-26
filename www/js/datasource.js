document.getElementById('mainForm').addEventListener('submit', function(event) {
    event.preventDefault();
    let res = new FormData(event.target)
    console.log(res)
});
