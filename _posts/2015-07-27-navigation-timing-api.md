---
layout: post
title:  "Navigation Timing API"
date:   2015-07-27 00:35:00
---
### Navigation Timing

A **API Navigation Timing** fornece dados que podem ser usadospara medir a performance de um website. Diferente de outros mecanismos baseado em Javascript que já foram usados para o mesmo proposito, esta API pode fornecer dados sobre a latência do começo ao fim que podem ser mais precisas e relevantes.

O exemplo a seguir mostra como você pode medir o tempo de carregamento percebido:

{% highlight javascript %}
function onLoad() { 
  var now = new Date().getTime();
  var page_load_time = now - performance.timing.navigationStart;
  console.log("Tempo de carregamento percebido pelo usuário: " + page_load_time);
}
{% endhighlight %}

Existem muitos eventos medidos em milisegundos que podem ser acessados através da interface [PerformanceTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming). A lista de eventos na ordem em que ocorrem são:

* navigationStart
* unloadEventStart
* unloadEventEnd
* redirectStart
* redirectEnd
* fetchStart
* domainLookupStart
* domainLookupEnd
* connectStart
* connectEnd
* secureConnectionStart
* requestStart
* responseStart
* responseEnd
* domLoading
* domInteractive
* domContentLoadedEventStart
* domContentLoadedEventEnd
* domComplete
* loadEventStart
* loadEventEnd

O objeto `window.performance.navigation` guarda dois atributos que podem ser usados para saber se o carregamento da página é iniciada por um redirecionamento, pelo botão voltar/avançar ou pela URL mesmo.

`window.performance.navigation.type`:  

| Constante | Valor | Descrição |
| --------- | ----- | --------- |
| TYPE_NAVIGATENEXT | 0 | Navegação iniciada pelo clique em um link, ou pela entrada da URL na barra de endereços, ou envio de formulário, ou inicializada através da operação de um script diferente que os usados por TYPE_RELOAD e TYPE_BACK_FORWARD como listado abaixo. |
| TYPE_RELOAD | 1 | Navegação através da operação de recarregamento ou pelo método location.reload(). |
| TYPE_BACK_FORWARD | 2 | Navegação através de uma operação de histórico. |
| TYPE_UNDEFINED | 255 | Qualquer tipo de navegação não definida pelos valores acima. |  
  
  
`window.performance.navigation.redirectCount` indicará, se houver, quantos redirecionamentos aconteceram até que a página final seja alcançada.

A API Navigation Timing pode ser usada para colher dados da performance do lado do cliente enviado para um servidor via XHR tanto quanto os dados medidos que eram muito dificultosos de medir de outras maneiras como o tempo de "descarga" de uma página anterior, tempo de look up do dominio, tempo total do `window.onload`, etc.

#### Exemplos

Calculando o tempo total necessário para carregar uma página:
{% highlight javascript %}
var perfData = window.performance.timing; 
var pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
{% endhighlight %}

Calculando os tempos de resposta da requisição:
{% highlight javascript %}
var connectTime = perfData.responseEnd - perfData.requestStart;
{% endhighlight %}
  
  
#### Links
* [Página de Testes](http://webtimingdemo.appspot.com/)  
* [http://w3c-test.org/webperf/specs/NavigationTiming/](http://w3c-test.org/webperf/specs/NavigationTiming/)  
* [http://www.w3.org/TR/navigation-timing/](http://www.w3.org/TR/navigation-timing/)

#### Navegadores compatíveis

#### **Desktop**  
  
|Feature  | Chrome | Firefox (Gecko) | Internet Explorer | Opera | Safari |
|:--------|:------:|:---------------:|:-----------------:|:-----:|:------:|
| Suporte básico | 6.0 | 7 (7) | 9 | 15.0 | 8 |  
  
#### **Mobile**  
  
| Feature | Android | Firefox Mobile (Gecko) | IE Mobile | Opera Mobile | Safari Mobile |
|:--------|:-------:|:----------------------:|:---------:|:------------:|:-------------:|
| Suporte básico | 4.0 | 15 (15) | 9 | 15.0 | 8 |  

  
[Artigo no MDN](https://developer.mozilla.org/pt-BR/docs/Web/API/Navigation_timing_API)
---
Rev 1.0: 2015-07-27
Rev 2.0: 2015-11-21