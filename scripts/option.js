$('document').ready(function(){
    chrome.storage.sync.get(['convertlead_email','convertlead_pwd'], function (result) {
        if (result.convertlead_email != undefined && result.convertlead_pwd != undefined) {
            $('#status').text('Your credential is saved');
            $("#email").val(result.convertlead_email);
            $("#password").val(result.convertlead_pwd);
        }
    });

    
    $('#save').click(function(){
        alert();
        var email = $('#email').val();
        var key = $('#password').val();

        $.post("https://api.convertlead.com/api/login", {email: email, password: key})
            .done(function(res){
                chrome.storage.sync.set({
                    convertlead_pwd: key,
                    convertlead_email: email
                }, function() {
                    $('#status').text('Your credential is saved');
                });
            })
            .fail(function(xhr, status, error) {
                $('#status').text('Your credential is incorrect').css("backgroundColor", "red");
            });;


    });
});