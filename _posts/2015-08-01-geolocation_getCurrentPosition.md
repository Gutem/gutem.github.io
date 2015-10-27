---
layout: post
title:  "Geolocation.getCurrentPosition()"
date:   2015-08-01 13:20:09
---

### Geolocation.getCurrentPosition()

O método `Geolocation.getCurrentPosition()` é usado para capturar a posição atual do dispositivo.

#### Síntaxe

{% highlight javascript %}
navigator.geolocation.getCurrentPosition(success, error, options)
{% endhighlight %}

##### Parâmetros

**_success_**
    Uma função de retorno que captura um objeto `Position` como seu parâmetro de entrada.
**_error_** _Optional_
    Uma função de retorno opcional que captura um objeto `PositionError` como seu parâmetro de entrada.
**_options_** _Optional_
    Um objeto opcional `PositionOptions`.

#### Exemplo
{% highlight javascript %}
var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;

  console.log('Sua posição atual é:');
  console.log('Latitude : ' + crd.latitude);
  console.log('Longitude: ' + crd.longitude);
  console.log('Mais ou menos ' + crd.accuracy + ' metros.');
};

function error(err) {
  console.warn('ERRO(' + err.code + '): ' + err.message);
};

navigator.geolocation.getCurrentPosition(success, error, options);
{% endhighlight %}

#### Especificações
| Especificações  | Estado       | Comentário            |
| --------------- | ------------ | --------------------- |
| Geolocation API | Recomendação | Especificação inicial |

#### Navegadores compatíveis

##### **Desktop**
| Feature | Chrome | Firefox (Gecko) | Internet Explorer | Opera | Safari |
|:--------|:------:|:----------------|:-----------------:|:------|:------:|
| Suporte básico | 5 | 3.5 (1.9.1) | 9 | 10.60 - Removido no 15.0 - Reintroduzido no 16.0 | 5 |

##### **Mobile**  
| Feature | Android | Chrome for Android | Firefox Mobile (Gecko) | IE Mobile | Opera Mobile | Safari Mobile |
|:--------|:-------:|:-------------------|:----------------------:|:----------|:------------:|:--------------|
| Suporte básico | ? | ? | 4.0 (4) | ? | 10.60 | ? | 

#### Veja também
* [Usando geolocalização](https://developer.mozilla.org/en-US/docs/WebAPI/Using_geolocation)
* [Navigator.geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/geolocation)
  
  
---
Rev 1.0: 2015-08-01
