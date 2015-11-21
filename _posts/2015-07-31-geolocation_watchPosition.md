---
layout: post
title:  "Geolocation.watchPosition()"
date:   2015-08-01 12:47:36
---
### Geolocation.watchPosition()

O método `Geolocation.watchPosition()` é usado para registrar uma função manipuladora (_handler function_) que irá ser chamada automáticamente  cada vez que a posição no dispositivo mudar. Você pode, opcionalemnte, especificar uma função de retorno que manipulará qualquer erro.

Este método retorna um valor para o `watch ID` que pode ser usado para desregistrar o manipulador passando isto para o método `Geolocation.clearWatch()`.

#### Síntaxe

{% highlight javascript %}
id = navigator.geolocation.watchPosition(success, error, options)
{% endhighlight %}

##### Parâmetros

**_success_**  
    Uma função de retorno que captura um objeto `Position` como parametro de entrada.  

**_error_** _Optional_  
    Uma função de retorno opcional que captura um objeto `PositionError` como parametro de entrada.  

**_options_** _Optional_  
    Um objeto opcional `PositionOptions`.

#### Exemplo

{% highlight javascript %}
var id, target, options;

function success(pos) {
  var crd = pos.coords;

  if (target.latitude === crd.latitude && target.longitude === crd.longitude) {
    console.log('Parabéns, você alcançou o destino');
    navigator.geolocation.clearWatch(id);
  }
}

function error(err) {
  console.warn('ERRO(' + err.code + '): ' + err.message);
}

target = {
  latitude : 0,
  longitude: 0
};

options = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 0
};

id = navigator.geolocation.watchPosition(success, error, options);
{% endhighlight %}

#### Especificações
| Especificações | Estado | Comentário |
|:---------------|:------:|:-----------|
| Geolocation API  A definição de 'Geolocation.watchPosition()' está naquela especificação | Recomendação | Especificação inicial |

#### Navegadores compatíveis

##### **Desktop** 
| Feature | Chrome | Firefox (Gecko) | Internet Explorer | Opera | Safari |
|:--------|:------:|:----------------|:-----------------:|:------|:------:|
| Suporte básico | 5 | 3.5 (1.9.1) | 9 | 10.60  Removido no 15.0  Reintroduzido no 16.0 | 5 |

##### **Mobile**  
| Feature | Android | Chrome for Android | Firefox Mobile (Gecko) | IE Mobile | Opera Mobile | Safari Mobile |
|:--------|:-------:|:-------------------|:----------------------:|:----------|:------------:|:--------------|
| Suporte básico | ? | ? | 4.0 (4) | ? | 10.60 | ? |  
  

#### Veja também
* [Usando geolocalização](https://developer.mozilla.org/en-US/docs/WebAPI/Using_geolocation)
* A interface que ele pertence, [Geolocation](https://developer.mozilla.org/pt-BR/docs/Web/API/Geolocation), e como acesar [NavigatorGeolocation.geolocation](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorGeolocation/geolocation).
* A operação oposta: [Geolocation.clearWatch()](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/clearWatch)
* Um método similar: [Geolocation.getCurrentPosition()](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
  
  
[Artigo no MDN](https://developer.mozilla.org/pt-BR/docs/Web/API/Geolocation/watchPosition)
---
Rev 1.0: 2015-08-01
